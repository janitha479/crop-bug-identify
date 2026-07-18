# ML — Pest classifier training

Train the pest-identification CNN on **Google Colab** (free T4 GPU), then download the
model into `backend/model/`.

## Steps

1. Open [`train_pest_classifier.ipynb`](train_pest_classifier.ipynb) in Google Colab
   (colab.research.google.com → File → Upload notebook).
2. Runtime → Change runtime type → **T4 GPU** → Save.
3. Runtime → **Run all**. The notebook will:
   - download the Kaggle *Agricultural Pests Image Dataset* (12 classes) via `kagglehub`,
   - fine-tune **MobileNetV3-Large** (ImageNet weights),
   - evaluate on a held-out test set (target ≥ 80% accuracy),
   - save `pest_model.keras`, `class_names.json`, and a confusion-matrix image.
4. Download the three output files (the last cell zips them and calls
   `files.download(...)`).
5. Put `pest_model.keras` and `class_names.json` into `backend/model/`.
   Keep the confusion-matrix image + the printed classification report for the project
   report's *AI Accuracy Testing* section.

## Notes

- The model now has **19 classes** = 12 general insects + 7 Sri Lankan crop pests.
  - **12 general** (from the *Agricultural Pests Image Dataset*): ants, bees, beetle,
    caterpillar, earthworms, earwig, grasshopper, moth, slug, snail, wasp, weevil.
  - **7 crop pests** (pulled from the **IP102** dataset by name): brown_planthopper,
    rice_stem_borer, fall_armyworm, fruit_fly, thrips, mealybug, leafhopper.
  All 19 match the keys in `backend/knowledge_base/pests.json`, so no relabeling is needed.
- **Check the IP102 matching output** in the notebook (section 5b/5c). It prints which IP102
  classes matched each crop pest and how many images were copied. If any crop pest shows
  `NO images found`, that class name in IP102 differs — tell me and I'll adjust the match list
  (`IP102_TARGETS`). A class with 0 images is simply skipped.
- Downloading IP102 is a few GB, so section 2 takes several minutes on Colab.
- **After training, replace BOTH files** in `backend/model/`: `pest_model.keras` **and**
  `class_names.json`. They must come from the same run — the class order in `class_names.json`
  must match the model. (The version committed to git still has the old 12 classes until you
  retrain.)
- If any class scores poorly, options are: train a few more epochs, add augmentation,
  or drop/merge that class (and remove it from `class_names.json` + `pests.json`).
- The exported `.keras` model needs TensorFlow to load. If your local Python can't run
  TensorFlow, uncomment the TFLite export cell to also produce `pest_model.tflite`, and
  run the backend with `tflite-runtime` (lighter, wider Python support). The backend runs
  on a mock model until a real model file is present, so nothing is blocked.
