import re

with open('frontend/src/components/ppk/Step3RincianHPS.jsx', 'r') as f:
    content = f.read()

# 1. Update the table wrapper and table itself
content = content.replace(
    '<div className="overflow-x-auto">\n                    <table className="w-full text-xs text-left border-collapse min-w-[800px]">',
    '<div className="w-full">\n                    <table className="w-full text-xs text-left border-collapse block md:table">\n                      <thead className="hidden md:table-header-group">'
)

content = content.replace(
    '</thead>\n                      <tbody>',
    '</thead>\n                      <tbody className="block md:table-row-group">'
)

# 2. Update the main <tr>
# <tr className={`border-b border-slate-100 hover:bg-slate-50/60 transition-colors ${isOverbudget ? 'bg-rose-50/50' : ''}`}>
content = content.replace(
    '<tr className={`border-b border-slate-100 hover:bg-slate-50/60 transition-colors ${isOverbudget ? \'bg-rose-50/50\' : \'\'}`}>',
    '<tr className={`block md:table-row border border-slate-200 md:border-x-0 md:border-t-0 md:border-b-slate-100 rounded-xl md:rounded-none mb-4 md:mb-0 p-4 md:p-0 relative hover:bg-slate-50/60 transition-colors ${isOverbudget ? \'bg-rose-50/50\' : \'bg-white md:bg-transparent\'}`}>'
)

# 3. Update No TD
content = content.replace(
    '<td className="py-3 px-3 text-center text-slate-400 font-bold">{idx + 1}</td>',
    '<td className="block md:table-cell py-1 md:py-3 px-0 md:px-3 text-left md:text-center text-slate-400 font-bold border-b border-dashed border-slate-200 md:border-0 pb-2 md:pb-0 mb-2 md:mb-0">\n                                  <span className="md:hidden text-[9px] uppercase tracking-wider text-slate-400 font-bold mr-2">No.</span>{idx + 1}\n                                </td>'
)

# 4. Update Nama Barang TD
content = content.replace(
    '<td className="py-3 px-2 text-slate-800">',
    '<td className="block md:table-cell py-2 md:py-3 px-0 md:px-2 text-slate-800">\n                                  <span className="md:hidden text-[9px] uppercase tracking-wider text-slate-400 font-bold block mb-1">Nama Barang / DPA</span>'
)

# 5. Update Referensi E-Katalog TD
content = content.replace(
    '<td className="py-3 px-2">\n                                  {surveyItem && surveyItem.success',
    '<td className="block md:table-cell py-2 md:py-3 px-0 md:px-2 border-t border-dashed border-slate-200 md:border-0 mt-3 md:mt-0 pt-3 md:pt-0">\n                                  <span className="md:hidden text-[9px] uppercase tracking-wider text-slate-400 font-bold block mb-1">Referensi E-Katalog</span>\n                                  {surveyItem && surveyItem.success'
)

# 6. Update Qty TD
content = content.replace(
    '<td className="py-3 px-2 text-center font-bold text-slate-700">',
    '<td className="block md:table-cell py-2 md:py-3 px-0 md:px-2 text-left md:text-center font-bold text-slate-700">\n                                  <span className="md:hidden text-[9px] uppercase tracking-wider text-slate-400 font-bold inline-block w-32">Qty</span>'
)

content = content.replace(
    'className="w-16 mx-auto bg-slate-50 border',
    'className="w-16 mx-0 md:mx-auto bg-slate-50 border'
)

# 7. Update Pagu DPA TD
content = content.replace(
    '<td className={`py-3 px-2 text-right font-mono transition-colors ${unitHpsPrice !== item.price ? \'text-slate-400\' : \'text-slate-500\'}`}>',
    '<td className={`block md:table-cell py-2 md:py-3 px-0 md:px-2 text-left md:text-right font-mono transition-colors ${unitHpsPrice !== item.price ? \'text-slate-400\' : \'text-slate-500\'}`}>\n                                  <span className="md:hidden text-[9px] uppercase tracking-wider text-slate-400 font-bold inline-block w-32 font-sans">Pagu DPA</span>'
)

# 8. Update Harga Tayang E-Katalog TD
content = content.replace(
    '<td className="py-3 px-4 text-right">',
    '<td className="block md:table-cell py-2 md:py-3 px-0 md:px-4 text-left md:text-right">\n                                  <span className="md:hidden text-[9px] uppercase tracking-wider text-slate-400 font-bold block mb-1">Harga Tayang E-Katalog</span>'
)

# 9. Update Total Tayang E-Katalog TD
content = content.replace(
    '<td className={`py-3 px-3 text-right font-mono font-bold transition-colors ${isOverbudget ? \'text-rose-600\' : (unitHpsPrice < item.price ? \'text-emerald-600\' : \'text-indigo-650\')}`}>',
    '<td className={`block md:table-cell py-2 md:py-3 px-0 md:px-3 text-left md:text-right font-mono font-bold transition-colors ${isOverbudget ? \'text-rose-600\' : (unitHpsPrice < item.price ? \'text-emerald-600\' : \'text-indigo-650\')}`}>\n                                  <span className="md:hidden text-[9px] uppercase tracking-wider text-slate-400 font-bold inline-block w-32 font-sans">Total Tayang</span>'
)

# 10. Update Expanded Accordion Row TR
content = content.replace(
    '<tr>\n                                  <td colSpan="7" className="p-0 border-b border-slate-100">',
    '<tr className="block md:table-row mb-4 md:mb-0 mt-[-10px] md:mt-0">\n                                  <td colSpan="7" className="block md:table-cell p-0 border-b border-slate-100 rounded-b-xl overflow-hidden">'
)

with open('frontend/src/components/ppk/Step3RincianHPS.jsx', 'w') as f:
    f.write(content)

print("Patched successfully!")
