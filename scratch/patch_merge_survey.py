import re

with open("frontend/src/components/ProcurementPanel.jsx", "r") as f:
    code = f.read()

old_logic = """    const savedItems = localStorage.getItem(`dpa_items_${pack.noSirup}`)
    if (savedItems) return JSON.parse(savedItems)"""

new_logic = """    const savedItemsStr = localStorage.getItem(`dpa_items_${pack.noSirup}`);
    if (savedItemsStr) {
      let parsedItems = JSON.parse(savedItemsStr);
      
      // Merge with PPK survey data (Harga Tayang & Vendor)
      const surveyStr = localStorage.getItem('pbj_survey_data');
      if (surveyStr) {
        try {
          const surveyData = JSON.parse(surveyStr);
          if (surveyData && surveyData.products) {
            parsedItems = parsedItems.map((item, idx) => {
              // Try to find matching product in survey by index or roughly by name
              const surveyProd = surveyData.products[idx];
              if (surveyProd) {
                return {
                  ...item,
                  tayang: surveyProd.price,
                  vendor: surveyProd.vendor,
                  link: surveyProd.link
                };
              }
              return item;
            });
          }
        } catch (e) {
          console.error('Failed to parse survey data', e);
        }
      }
      return parsedItems;
    }"""

code = code.replace(old_logic, new_logic)

with open("frontend/src/components/ProcurementPanel.jsx", "w") as f:
    f.write(code)

print("Merge survey data applied.")
