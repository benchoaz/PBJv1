import re

with open("/home/beni/PBJ/dpa-parser/main.py", "r") as f:
    content = f.read()

# Fix the mess in refine_rincian_with_ai
# First, remove the bad deepseek and cohere blocks
bad_block_start = content.find("                elif provider == \"deepseek\":")
bad_block_end = content.find("                items_list = []")

if bad_block_start != -1 and bad_block_end != -1:
    clean_content = content[:bad_block_start] + "                        parsed = json.loads(ai_text)\n                        \n                        items_list = []" + content[bad_block_end + len("                items_list = []"):]
    
    # Now insert deepseek and cohere correctly
    # They should be at the same indentation level as:
    #         elif provider == "groq":
    
    # Find the end of the groq block
    # The groq block ends after the except Exception as e: block inside the try: block of the provider checks.
    # Wait, the provider check is:
    #     try:
    #         if provider == "gemini":
    #         elif provider == "groq":
    #             for model_name in models_to_try:
    #                 try: ...
    #                 except urllib.error.HTTPError as he: ...
    #                 except Exception as e: ...
    #             return []
    
    search_str = "                    continue\n            return []"
    idx = clean_content.find(search_str)
    if idx != -1:
        insert_idx = idx + len(search_str)
        new_providers = """
        elif provider == "deepseek":
            url = "https://api.deepseek.com/chat/completions"
            headers["Authorization"] = f"Bearer {api_key}"
            req_body = {
                "model": "deepseek-chat",
                "messages": [{"role": "user", "content": prompt}],
                "temperature": 0.1,
                "response_format": {"type": "json_object"}
            }
            data_bytes = json.dumps(req_body).encode("utf-8")
            req = urllib.request.Request(url, data=data_bytes, headers=headers, method="POST")
            with urllib.request.urlopen(req, timeout=60) as response:
                res_data = json.loads(response.read().decode("utf-8"))
                ai_text = res_data["choices"][0]["message"]["content"].strip()
                if ai_text.startswith("```"):
                    ai_text = re.sub(r"^```(?:json)?\\n|```$", "", ai_text, flags=re.MULTILINE).strip()
                parsed = json.loads(ai_text)
                items_list = []
                if isinstance(parsed, list):
                    items_list = parsed
                elif isinstance(parsed, dict):
                    for val in parsed.values():
                        if isinstance(val, list):
                            items_list = val
                            break
                    if not items_list:
                        items_list = [parsed]
                
                result_items = []
                for idx, item in enumerate(items_list):
                    vol = float(item.get("volume", 1.0) or 1.0)
                    harga_sat = int(item.get("harga_satuan", 0) or 0)
                    harga_tot = int(item.get("harga_total", 0) or (vol * harga_sat))
                    if harga_sat == 0 or harga_tot == 0: continue
                    result_items.append(RincianItem(
                        no=len(result_items) + 1,
                        nama=str(item.get("nama", "Item Detail DPA") or "Item Detail DPA")[:120],
                        volume=vol,
                        satuan=normalize_satuan(str(item.get("satuan", "Buah") or "Buah")),
                        harga_satuan=harga_sat,
                        harga_total=harga_tot
                    ))
                return result_items
        elif provider == "cohere":
            url = "https://api.cohere.com/v1/chat"
            headers["Authorization"] = f"Bearer {api_key}"
            req_body = {
                "model": "command-r-plus-08-2024",
                "message": prompt,
                "temperature": 0.1
            }
            data_bytes = json.dumps(req_body).encode("utf-8")
            req = urllib.request.Request(url, data=data_bytes, headers=headers, method="POST")
            with urllib.request.urlopen(req, timeout=60) as response:
                res_data = json.loads(response.read().decode("utf-8"))
                ai_text = res_data["text"].strip()
                if ai_text.startswith("```"):
                    ai_text = re.sub(r"^```(?:json)?\\n|```$", "", ai_text, flags=re.MULTILINE).strip()
                parsed = json.loads(ai_text)
                items_list = []
                if isinstance(parsed, list):
                    items_list = parsed
                elif isinstance(parsed, dict):
                    for val in parsed.values():
                        if isinstance(val, list):
                            items_list = val
                            break
                    if not items_list:
                        items_list = [parsed]
                
                result_items = []
                for idx, item in enumerate(items_list):
                    vol = float(item.get("volume", 1.0) or 1.0)
                    harga_sat = int(item.get("harga_satuan", 0) or 0)
                    harga_tot = int(item.get("harga_total", 0) or (vol * harga_sat))
                    if harga_sat == 0 or harga_tot == 0: continue
                    result_items.append(RincianItem(
                        no=len(result_items) + 1,
                        nama=str(item.get("nama", "Item Detail DPA") or "Item Detail DPA")[:120],
                        volume=vol,
                        satuan=normalize_satuan(str(item.get("satuan", "Buah") or "Buah")),
                        harga_satuan=harga_sat,
                        harga_total=harga_tot
                    ))
                return result_items"""
        clean_content = clean_content[:insert_idx] + new_providers + clean_content[insert_idx:]
    
    with open("/home/beni/PBJ/dpa-parser/main.py", "w") as f:
        f.write(clean_content)
    print("Fixed!")
else:
    print("Could not find bad block")
