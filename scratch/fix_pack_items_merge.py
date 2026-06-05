import re

with open("frontend/src/components/ProcurementPanel.jsx", "r") as f:
    code = f.read()

# Fix the getPackageItems to merge survey data into `pack.items` as well, for backward compatibility
old_logic = """  function getPackageItems(pack) {
    if (!pack) return []
    
    // ✅ Sync Fix: Use the finalized items injected by PPK if available
    if (pack.items && pack.items.length > 0) return pack.items;
    
    const savedItemsStr = localStorage.getItem(`dpa_items_${pack.noSirup}`);"""

new_logic = """  function getPackageItems(pack) {
    if (!pack) return []
    
    // Helper function to merge survey data
    const mergeSurveyData = (items) => {
      try {
        const surveyStr = localStorage.getItem('pbj_survey_data');
        if (!surveyStr) return items;
        const surveyData = JSON.parse(surveyStr);
        if (!surveyData || !surveyData.products) return items;
        
        return items.map((item, idx) => {
          const surveyProd = surveyData.products[idx];
          if (surveyProd && !item.katalogPrice && !item.tayang && !item.vendor) {
            return {
              ...item,
              tayang: surveyProd.price,
              katalogPrice: surveyProd.price,
              vendor: surveyProd.vendor,
              link: surveyProd.link
            };
          }
          return item;
        });
      } catch (e) {
        return items;
      }
    };

    // ✅ Sync Fix: Use the finalized items injected by PPK if available
    if (pack.items && pack.items.length > 0) {
      return mergeSurveyData(pack.items);
    }
    
    const savedItemsStr = localStorage.getItem(`dpa_items_${pack.noSirup}`);"""

code = code.replace(old_logic, new_logic)

with open("frontend/src/components/ProcurementPanel.jsx", "w") as f:
    f.write(code)

print("Merge logic added to pack.items.")
