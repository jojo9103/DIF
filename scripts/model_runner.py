import argparse
import os
from pathlib import Path

import cv2
import numpy as np
import pandas as pd
import torch
import torch.nn as nn
import torch.nn.functional as F
from PIL import Image
from torchvision import transforms
from torchvision.models import (
    resnet18,
    resnet50,
    resnext50_32x4d,
    vit_b_16,
    swin_t,
    densenet121,
    efficientnet_b2,
    convnext_tiny,
    ResNet18_Weights,
    ResNet50_Weights,
    ResNeXt50_32X4D_Weights,
    ViT_B_16_Weights,
    Swin_T_Weights,
    DenseNet121_Weights,
    EfficientNet_B2_Weights,
    ConvNeXt_Tiny_Weights,
)


class DIFMultiTaskNet(nn.Module):
    def __init__(self, backbone: str = "resnext50_32x4d", num_patterns: int = 2):
        super().__init__()
        self.backbone, feat_dim = self._build_backbone(backbone)
        self.pattern_head = nn.Linear(feat_dim, num_patterns)

    def _build_backbone(self, name: str):
        name = name.lower()
        if name == "resnet18":
            weights = ResNet18_Weights.DEFAULT
            model = resnet18(weights=None)
            feat_dim = model.fc.in_features
            model.fc = nn.Identity()
            return model, feat_dim
        if name == "resnet50":
            weights = ResNet50_Weights.DEFAULT
            model = resnet50(weights=None)
            feat_dim = model.fc.in_features
            model.fc = nn.Identity()
            return model, feat_dim
        if name in ["resnext50_32x4d", "resnext50"]:
            weights = ResNeXt50_32X4D_Weights.DEFAULT
            model = resnext50_32x4d(weights=None)
            feat_dim = model.fc.in_features
            model.fc = nn.Identity()
            return model, feat_dim
        if name in ["vit_b_16", "vit"]:
            weights = ViT_B_16_Weights.DEFAULT
            model = vit_b_16(weights=None)
            feat_dim = model.heads.head.in_features
            model.heads = nn.Identity()
            return model, feat_dim
        if name in ["swin_t", "swin"]:
            weights = Swin_T_Weights.DEFAULT
            model = swin_t(weights=None)
            feat_dim = model.head.in_features
            model.head = nn.Identity()
            return model, feat_dim
        if name in ["densenet121", "densenet"]:
            weights = DenseNet121_Weights.DEFAULT
            model = densenet121(weights=None)
            feat_dim = model.classifier.in_features
            model.classifier = nn.Identity()
            return model, feat_dim
        if name in ["efficientnet_b2", "efficientnet"]:
            weights = EfficientNet_B2_Weights.DEFAULT
            model = efficientnet_b2(weights=None)
            feat_dim = model.classifier[1].in_features
            model.classifier = nn.Identity()
            return model, feat_dim
        if name in ["convnext_tiny", "convnext_t"]:
            weights = ConvNeXt_Tiny_Weights.DEFAULT
            model = convnext_tiny(weights=None)
            feat_dim = model.classifier[2].in_features
            model.classifier = nn.Sequential(model.classifier[0], model.classifier[1], nn.Identity())
            return model, feat_dim
        raise ValueError(f"Unsupported backbone: {name}")

    def forward(self, x):
        feat = self.backbone(x)
        return self.pattern_head(feat)


def load_model(weights_path: str, device: str, backbone: str, num_patterns: int):
    model = DIFMultiTaskNet(backbone=backbone, num_patterns=num_patterns)
    if weights_path:
        checkpoint = torch.load(weights_path, map_location=device)
        state = checkpoint["state_dict"] if isinstance(checkpoint, dict) and "state_dict" in checkpoint else checkpoint
        model.load_state_dict(state, strict=False)
    return model.to(device).eval()


def generate_gradcam(model, image_tensor, class_idx, device):
    target_layer = model.backbone.layer4[-1]
    activations = None
    gradients = None

    def forward_hook(_module, _input, output):
        nonlocal activations
        activations = output

    def backward_hook(_module, _grad_input, grad_output):
        nonlocal gradients
        gradients = grad_output[0]

    fh = target_layer.register_forward_hook(forward_hook)
    bh = target_layer.register_backward_hook(backward_hook)

    try:
        output = model(image_tensor)
        model.zero_grad()
        score = output[0, class_idx]
        score.backward()

        weights = torch.mean(gradients[0], dim=(1, 2))
        cam = torch.zeros(activations.shape[2:], device=device)
        for i, w in enumerate(weights):
            cam += w * activations[0, i]
        cam = F.relu(cam)
        cam = cam - cam.min()
        cam = cam / (cam.max() + 1e-8)
        cam = F.interpolate(cam.unsqueeze(0).unsqueeze(0), size=image_tensor.shape[2:], mode="bilinear", align_corners=False).squeeze()
        return cam.detach().cpu().numpy()
    finally:
        fh.remove()
        bh.remove()


def create_overlay(image: np.ndarray, heatmap: np.ndarray, alpha: float = 0.4) -> np.ndarray:
    if heatmap.shape[:2] != image.shape[:2]:
        heatmap = cv2.resize(heatmap, (image.shape[1], image.shape[0]), interpolation=cv2.INTER_LINEAR)
    heatmap_colored = cv2.applyColorMap((heatmap * 255).astype(np.uint8), cv2.COLORMAP_JET)
    heatmap_colored = cv2.cvtColor(heatmap_colored, cv2.COLOR_BGR2RGB).astype(np.float32) / 255.0
    image_norm = image.astype(np.float32) / 255.0
    overlay = cv2.addWeighted(image_norm, 1 - alpha, heatmap_colored, alpha, 0)
    return (overlay * 255).astype(np.uint8)


def main():
    parser = argparse.ArgumentParser(description="Run DIF model inference for uploaded images.")
    parser.add_argument("--input", required=True, help="Input folder containing images")
    parser.add_argument("--output", required=True, help="Output folder for results")
    parser.add_argument("--weights", required=False, help="Path to model .pth")
    parser.add_argument(
        "--backbone",
        default="resnext50_32x4d",
        help="Backbone name (resnet18, resnet50, resnext50_32x4d, vit_b_16, swin_t, densenet121, efficientnet_b2, convnext_tiny)",
    )
    parser.add_argument("--classes", default="Linear Pattern,Peri-vascular Pattern")
    parser.add_argument("--batch-size", type=int, default=1)
    parser.add_argument("--device", default="cuda:0" if torch.cuda.is_available() else "cpu")
    parser.add_argument("--progress-file", default="")
    parser.add_argument("--targets", default="")
    parser.add_argument("--project", default="")
    parser.add_argument("--user", default="")
    args = parser.parse_args()

    class_names = [c.strip() for c in args.classes.split(",") if c.strip()]
    output_dir = Path(args.output)
    output_dir.mkdir(parents=True, exist_ok=True)

    model = load_model(args.weights, args.device, args.backbone, len(class_names))

    transform = transforms.Compose(
        [
            transforms.Resize((512, 512)),
            transforms.ToTensor(),
            transforms.Normalize([0.485, 0.456, 0.406], [0.229, 0.224, 0.225]),
        ]
    )

    image_exts = {".png", ".jpg", ".jpeg", ".tif", ".tiff"}
    input_dir = Path(args.input)
    image_paths = [p for p in input_dir.rglob("*") if p.suffix.lower() in image_exts]

    summary_rows = []
    targets_map = {}
    if args.targets:
        try:
            df_targets = pd.read_csv(args.targets)
            for _, row in df_targets.iterrows():
                name = str(row.get("Image_name", "")).strip()
                if not name:
                    continue
                targets_map[name] = {
                    "Linear Pattern_target": row.get("Linear Pattern_target", ""),
                    "Peri-vascular Pattern_target": row.get("Peri-vascular Pattern_target", ""),
                }
        except Exception:
            targets_map = {}
    summary_columns = ["sample_idx", "image_path", "is_correct", "Image_name"]
    for class_name in class_names:
        summary_columns.extend(
            [
                f"{class_name}_target",
                f"{class_name}_prediction",
                f"{class_name}_probability",
                f"{class_name}_correct",
            ]
        )
    total_images = len(image_paths)
    progress_path = Path(args.progress_file) if args.progress_file else None
    if progress_path:
        try:
            progress_path.parent.mkdir(parents=True, exist_ok=True)
            progress_path.write_text("0", encoding="utf-8")
        except Exception:
            progress_path = None

    batch_size = max(1, int(args.batch_size))

    for batch_start in range(0, len(image_paths), batch_size):
        batch_paths = image_paths[batch_start : batch_start + batch_size]
        batch_imgs = [Image.open(p).convert("RGB") for p in batch_paths]
        batch_tensor = torch.stack([transform(img) for img in batch_imgs]).to(args.device)

        with torch.no_grad():
            logits = model(batch_tensor)
            probs_batch = torch.sigmoid(logits).cpu().numpy()
            preds_batch = (probs_batch > 0.5).astype(int)

        for offset, img_path in enumerate(batch_paths):
            img = batch_imgs[offset]
            tensor = batch_tensor[offset : offset + 1]
            probs = probs_batch[offset]
            preds = preds_batch[offset]

            heatmaps = []
            for class_idx in range(len(class_names)):
                heatmaps.append(generate_gradcam(model, tensor, class_idx, args.device))

            sample_name = img_path.stem
            sample_dir = output_dir / sample_name
            sample_dir.mkdir(exist_ok=True)

            original_img = np.array(img)
            Image.fromarray(original_img).save(sample_dir / "original.png")

            for class_idx, class_name in enumerate(class_names):
                heatmap = heatmaps[class_idx]
                heatmap_colored = cv2.applyColorMap((heatmap * 255).astype(np.uint8), cv2.COLORMAP_JET)
                heatmap_colored = cv2.cvtColor(heatmap_colored, cv2.COLOR_BGR2RGB)
                Image.fromarray(heatmap_colored).save(sample_dir / f"heatmap_{class_name}.png")

                overlay = create_overlay(original_img, heatmap, alpha=0.4)
                Image.fromarray(overlay).save(sample_dir / f"overlay_{class_name}.png")

            target_row = targets_map.get(sample_name, {})
            linear_target = target_row.get("Linear Pattern_target", "")
            peri_target = target_row.get("Peri-vascular Pattern_target", "")
            row = {
                "sample_idx": batch_start + offset,
                "image_path": str(img_path),
                "is_correct": "",
                "Image_name": sample_name,
            }
            for class_idx, class_name in enumerate(class_names):
                if class_name == "Linear Pattern":
                    row[f"{class_name}_target"] = linear_target
                elif class_name == "Peri-vascular Pattern":
                    row[f"{class_name}_target"] = peri_target
                else:
                    row[f"{class_name}_target"] = ""
                row[f"{class_name}_prediction"] = int(preds[class_idx])
                row[f"{class_name}_probability"] = float(probs[class_idx])
                target_value = row[f"{class_name}_target"]
                if target_value == "" or pd.isna(target_value):
                    row[f"{class_name}_correct"] = ""
                else:
                    try:
                        row[f"{class_name}_correct"] = int(int(target_value) == int(preds[class_idx]))
                    except Exception:
                        row[f"{class_name}_correct"] = ""
            summary_rows.append(row)

            if progress_path and total_images:
                done = batch_start + offset + 1
                percent = int(round((done / total_images) * 100))
                try:
                    progress_path.write_text(str(percent), encoding="utf-8")
                except Exception:
                    progress_path = None

    pd.DataFrame(summary_rows, columns=summary_columns).to_csv(
        output_dir / "heatmap_summary.csv", index=False
    )


if __name__ == "__main__":
    main()
