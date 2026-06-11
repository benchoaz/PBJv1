import base64
from ssh_command import run_ssh_command

def download_file(remote_path, local_path):
    cmd = f"base64 {remote_path}"
    b64_out = run_ssh_command("43.134.166.153", "ubuntu", "nebula-57@-ocean", cmd)
    with open(local_path, "wb") as f:
        f.write(base64.b64decode(b64_out.strip()))
    print(f"Downloaded {remote_path} to {local_path}")

try:
    download_file("/home/ubuntu/PBJv1/frontend/public/screenshots/sirup-error-1780837070990.png", "/home/beni/.gemini/antigravity-ide/brain/56833f17-ef6c-463b-995f-17c0e1e2c5b2/sirup_error.png")
except Exception as e:
    print(f"Error: {e}")
