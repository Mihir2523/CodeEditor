import redis
import json
import uuid
import os
import subprocess
import traceback
from mongoengine import connect
from models import Code
from config import cloudinary

connect(
    host="mongodb+srv://darsh2510:darsh%402510@project.wt9x4.mongodb.net/?retryWrites=true&w=majority&appName=Project"
)

r = redis.Redis(
    host='redis-15965.c301.ap-south-1-1.ec2.redns.redis-cloud.com',
    port=15965,
    decode_responses=True,
    username="default",
    password="2KVpzJCk4H4Jm41fxIuRhDrcbxCdWE83",
)


TEMP_DIR = "tmp_code"
os.makedirs(TEMP_DIR, exist_ok=True)

def listen():
    while True:
        try:
            _, message = r.blpop("code_queue")
            data = json.loads(message)
            code_id = data["code_id"]
            code_text = data["code"]

            filename = f"{TEMP_DIR}/{uuid.uuid4().hex}.py"
            image_path = f"{TEMP_DIR}/{uuid.uuid4().hex}.png"
            output = ""
            error = False
            image_url = ""
            has_image = False

            try:
                # Inject safe plotting backend and imports
                safe_code = (
                    "import matplotlib\n"
                    "matplotlib.use('Agg')\n"
                    "import matplotlib.pyplot as plt\n"
                    "import seaborn as sns\n"
                ) + code_text + (
                    f"\nif plt.get_fignums():\n"
                    f"    plt.savefig('{image_path}')\n"
                )

                with open(filename, "w", encoding="utf-8") as f:
                    f.write(safe_code)

                result = subprocess.run(
                    ["python", filename],
                    capture_output=True,
                    text=True,
                    timeout=10
                )

                output = result.stdout or result.stderr
                if result.returncode != 0:
                    error = True

                if os.path.exists(image_path):
                    has_image = True
                    upload_result = cloudinary.uploader.upload(image_path)
                    image_url = upload_result["secure_url"]
                    os.remove(image_path)

            except subprocess.TimeoutExpired:
                output = "Error: Code execution timed out after 10 seconds."
                error = True
            except Exception:
                output = traceback.format_exc()
                error = True
            finally:
                if os.path.exists(filename):
                    os.remove(filename)

            # Update MongoDB with results
            Code.objects(id=code_id).update_one(
                set__isComplete=True,
                set__errors=error,
                set__output=output,
                set__imageExist=has_image,
                set__imageLink=image_url
            )

        except Exception as e:
            print("Worker Error:", str(e))

if __name__ == "__main__":
    listen()