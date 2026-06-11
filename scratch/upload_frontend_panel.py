import sys
sys.path.insert(0, '/home/beni/PBJ/scratch')
import subprocess

def scp_file(local_path, remote_path):
    return subprocess.run(['scp', '-i', '/home/beni/.ssh/id_rsa', '-o', 'StrictHostKeyChecking=no', local_path, f'ubuntu@43.134.166.153:{remote_path}'], capture_output=True, text=True)

print(scp_file('/home/beni/PBJ/frontend/src/components/ProcurementPanel.jsx', '/home/ubuntu/PBJv1/frontend/src/components/ProcurementPanel.jsx'))
