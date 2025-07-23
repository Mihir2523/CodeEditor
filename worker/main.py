from fastapi import FastAPI
import threading
import redis
import json
import uuid
import os
import subprocess
import traceback
import time
import tempfile
from mongoengine import connect
from bson import ObjectId
import cloudinary
import cloudinary.uploader
import mongoengine as me

cloudinary.config(
    cloud_name="dn72w95yk",
    api_key="389439419955665",
    api_secret="Iqt4Uk1GN704av4S85thL5NjxpY"
)

class Code(me.Document):
    user = me.ReferenceField('Userss')
    code = me.StringField(required=True)
    isComplete = me.BooleanField(default=False)
    imageExist = me.BooleanField(default=False)
    imageLink = me.StringField(default='')
    errors = me.BooleanField(default=False)
    output = me.StringField(default='')
    meta = {'collection': 'codes'}

r = redis.Redis(
    host='redis-15965.c301.ap-south-1-1.ec2.redns.redis-cloud.com',
    port=15965,
    decode_responses=True,
    username="default",
    password="2KVpzJCk4H4Jm41fxIuRhDrcbxCdWE83",
)

BANNED_KEYWORDS = [
    'import os', 'import sys', 'open(', 'exec(', 'eval(',
    'subprocess', 'shutil', 'socket', '__import__'
]

app = FastAPI()

def listen():
    TEMP_DIR = tempfile.mkdtemp()
    print(f"Worker started. Temp directory: {TEMP_DIR}")
    
    while True:
        try:
            _, message = r.blpop("codeQueue")
            data = json.loads(message)
            code_id = data["id"]
            code_text = data["code"]
            start_time = time.time()

            filename = os.path.join(TEMP_DIR, f"{uuid.uuid4().hex}.py")
            image_path = os.path.join(TEMP_DIR, f"{uuid.uuid4().hex}.png")

            output = ""
            error = False
            image_url = ""
            has_image = False

            try:
                code_lower = code_text.lower()
                for banned in BANNED_KEYWORDS:
                    if banned in code_lower:
                        raise ValueError(f"Banned keyword detected: {banned}")

                pre_code = """
import matplotlib
matplotlib.use('Agg')
import matplotlib.pyplot as plt
"""

                post_code = """
if 'plt' in locals() and plt.get_fignums():
    plt.savefig(r'{}')
    plt.close()
""".format(image_path.replace(os.sep, '/'))

                safe_code = pre_code + code_text + post_code

                with open(filename, "w", encoding="utf-8") as f:
                    f.write(safe_code)

                result = subprocess.run(
                    ["python", filename],
                    capture_output=True,
                    text=True,
                    timeout=30 
                )

                output = result.stdout or result.stderr
                error = result.returncode != 0
                print(f"Execution completed in {time.time() - start_time:.2f}s")

                if os.path.exists(image_path):
                    try:
                        upload_result = cloudinary.uploader.upload(image_path)
                        image_url = upload_result.get("secure_url", "")
                        has_image = bool(image_url)
                        print("Image uploaded successfully")
                    except Exception as e:
                        print(f"Image upload failed: {e}")
                        error = True
                        output += f"\nImage upload error: {e}"

            except subprocess.TimeoutExpired:
                output = "Error: Code execution timed out after 30 seconds."
                error = True
                print(output)
            except Exception as e:
                output = f"Error: {str(e)}\n{traceback.format_exc()}"
                error = True
                print(f"Execution failed: {output}")
            finally:
                for file in [filename, image_path]:
                    try:
                        if file and os.path.exists(file):
                            os.remove(file)
                    except Exception as e:
                        print(f"Error cleaning up {file}: {e}")

            try:
                Code.objects(id=ObjectId(code_id)).update_one(
                    set__isComplete=True,
                    set__errors=error,
                    set__output=output,
                    set__imageExist=has_image,
                    set__imageLink=image_url
                )
                print(f"Successfully updated MongoDB for job {code_id}")
            except Exception as e:
                print(f"Failed to update MongoDB: {str(e)}")

        except redis.exceptions.ConnectionError:
            print("Redis connection lost - retrying in 5 seconds")
            time.sleep(5)
        except Exception as e:
            print(f"Worker error: {traceback.format_exc()}")
            time.sleep(1)

@app.on_event("startup")
def startup_event():
    """Initialize connections and start worker thread"""
    try:
        print("Checking dependencies...")
        subprocess.run(["python", "-c", "import matplotlib, seaborn"], check=True)
        
        print("Connecting to MongoDB...")
        connect(
            host="mongodb+srv://darsh2510:darsh%402510@project.wt9x4.mongodb.net/?retryWrites=true&w=majority&appName=Project",
            alias="default"
        )
        
        print("Connecting to Redis...")
        if not r.ping():
            raise RuntimeError("Redis connection failed")
            
        print("Starting worker thread...")
        worker_thread = threading.Thread(target=listen, daemon=True)
        worker_thread.start()
        print("Worker started successfully")
        
    except subprocess.CalledProcessError:
        print("ERROR: Required packages not found. Installing...")
        subprocess.run(["pip", "install", "matplotlib", "seaborn"], check=True)
    except Exception as e:
        print(f"Startup failed: {str(e)}")
        raise

@app.get("/")
def get():
    return {
        "status": True,
    }
