import sys

with open('/home/ubuntu/PBJv1/survey-service/server.js', 'r') as f:
    code = f.read()

old_logic = """    const expensiveOptions = results.filter(r => 
       (!targetVendor || !r.vendor.toLowerCase().includes(targetVendor.toLowerCase())) &&
       (currentVendorItem ? r.price > currentVendorItem.price : true) &&
       (alternative ? r.vendor !== alternative.vendor : true)
    );"""

new_logic = """    const expensiveOptions = results.filter(r => 
       (!targetVendor || !r.vendor.toLowerCase().includes(targetVendor.toLowerCase())) &&
       (alternative ? r.vendor !== alternative.vendor : true)
    );"""

if old_logic in code:
    code = code.replace(old_logic, new_logic)
    with open('/home/ubuntu/PBJv1/survey-service/server.js', 'w') as f:
        f.write(code)
    print("Logic patched!")
else:
    print("Old logic not found!")
