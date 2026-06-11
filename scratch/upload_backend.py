import sys
sys.path.insert(0, '/home/beni/PBJ/scratch')
import subprocess

def run_ssh_cmd(cmd):
    return subprocess.run(['ssh', '-i', '/home/beni/.ssh/id_rsa', '-o', 'StrictHostKeyChecking=no', 'ubuntu@43.134.166.153', cmd], capture_output=True, text=True)

def scp_file(local_path, remote_path):
    return subprocess.run(['scp', '-i', '/home/beni/.ssh/id_rsa', '-o', 'StrictHostKeyChecking=no', local_path, f'ubuntu@43.134.166.153:{remote_path}'], capture_output=True, text=True)

print(scp_file('/home/beni/PBJ/backend/cmd/server/main.go', '/home/ubuntu/PBJv1/backend/cmd/server/main.go'))
