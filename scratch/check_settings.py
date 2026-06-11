import sys
sys.path.insert(0, '/home/beni/PBJ/scratch')
from ssh_command import run_ssh_command

r = run_ssh_command('43.134.166.153', 'ubuntu', 'nebula-57@-ocean', "docker compose exec db psql -U postgres -d pbj_db -c 'SELECT * FROM app_settings;'")
print(r)
