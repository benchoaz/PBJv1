import re

with open("frontend/src/components/ProcurementPreparation.jsx", "r") as f:
    code = f.read()

# Replace imports
code = code.replace("import React, { useEffect } from 'react';", "import React, { useEffect, useRef } from 'react';")

# Replace useEffect
old_effect = """  const [searchParams] = useSearchParams();
  const paketId = searchParams.get('paketId');

  useEffect(() => {
    if (paketId && paketId !== currentProjectId) {
      fetch(`/api/projects/${paketId}`)
        .then(res => {
          if (!res.ok) throw new Error('Paket tidak ditemukan');
          return res.json();
        })
        .then(data => {
          loadProjectData(data);
        })
        .catch(err => {
          console.error(err);
          alert('Gagal memuat paket: ' + err.message);
        });
    }
  }, [paketId, currentProjectId, loadProjectData]);"""

new_effect = """  const [searchParams] = useSearchParams();
  const paketId = searchParams.get('paketId');
  const fetchedIdRef = useRef(null);

  useEffect(() => {
    // ALWAYS fetch from DB when navigating here with a paketId
    // We use a ref to prevent infinite loops caused by loadProjectData changing
    if (paketId && fetchedIdRef.current !== paketId) {
      fetchedIdRef.current = paketId;
      fetch(`/api/projects/${paketId}`)
        .then(res => {
          if (!res.ok) throw new Error('Paket tidak ditemukan');
          return res.json();
        })
        .then(data => {
          loadProjectData(data);
        })
        .catch(err => {
          console.error(err);
          alert('Gagal memuat paket: ' + err.message);
        });
    }
  }, [paketId, loadProjectData]);"""

code = code.replace(old_effect, new_effect)

with open("frontend/src/components/ProcurementPreparation.jsx", "w") as f:
    f.write(code)

print("Patched ProcurementPreparation.jsx with useRef force fetch")
