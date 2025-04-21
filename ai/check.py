import google.generativeai as genai

genai.configure(api_key="AIzaSyDpzpjDcyXb9KhAyEpbYH-5IZlYdsB9uXk")

models = genai.list_models()
for model in models:
    print(model.name)
