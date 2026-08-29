# FarmSight - Paddy Disease Detection

This module detects diseases in Paddy crop images using a fine-tuned EfficientNetB0 deep learning model.

## Model

- Architecture: EfficientNetB0
- Pretrained Weights: ImageNet
- Input Size: 224 x 224 x 3
- Output: 10-class Softmax Classification
- Dataset: Paddy Doctor
- Total Images: 10,407
- Data Split: 70% Train / 15% Validation / 15% Test
- Batch Size: 16

## Supported Classes

1. bacterial_leaf_blight
2. bacterial_leaf_streak
3. bacterial_panicle_blight
4. blast
5. brown_spot
6. dead_heart
7. downy_mildew
8. hispa
9. normal
10. tungro

## Final Model Performance

- Test Accuracy: 71.45%
- Test Loss: 0.8666
- Macro Precision: 70.17%
- Macro Recall: 65.30%
- Macro F1 Score: 67.02%
- Weighted F1 Score: 70.95%

## Prediction Flow

Paddy Image
→ Image Quality Check
→ Image Preprocessing
→ EfficientNetB0
→ Disease Prediction
→ Confidence Check
→ Disease + Confidence

Low-confidence predictions are returned as `uncertain` instead of presenting an unreliable diagnosis.

## Prediction Output

Example:

{
  "crop": "paddy",
  "disease": "dead_heart",
  "confidence": 99.69,
  "message": "Prediction successful."
}

For low-confidence predictions:

{
  "crop": "paddy",
  "disease": "uncertain",
  "confidence": 41.64,
  "message": "Disease could not be identified confidently. Please upload another clear image showing the affected area."
}

## Files

- `models/paddy_disease_model.keras` - trained EfficientNetB0 model
- `models/paddy_class_names.json` - ordered disease class labels
- `preprocessing.py` - image preprocessing and quality validation
- `predictor.py` - model loading and disease prediction
- `test_prediction.py` - local prediction testing
- `notebooks/` - model training and evaluation notebook

## Integration

The prediction output is designed to be passed to FarmSight's Disease Intelligence module for further disease information, recommendations, and explanations.