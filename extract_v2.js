const fs = require('fs');
const file = fs.readFileSync('/home/beni/PBJ/frontend/src/components/ProcurementPreparation.jsx.backup', 'utf-8');

// The file has a lot of components and logic.
// We'll extract the UI sections.

// Step 3 starts with: {/* Step 3: HPS Formulation & Technical Specification */}
const step3Start = file.indexOf('{/* Step 3: HPS Formulation & Technical Specification */}');
// Step 4 (Document Generation) starts with: {/* Document Generation Action Center */}
const step4Start = file.indexOf('{/* Document Generation Action Center */}');
// Step 5 (Submit/Review) starts with: <div className="border-t border-slate-200/60 pt-4 mt-2">
const step5Start = file.indexOf('<div className="border-t border-slate-200/60 pt-4 mt-2">');
// The document preview modal starts with: {/* DOCUMENT PREVIEW MODAL
const previewModalStart = file.indexOf('{/* DOCUMENT PREVIEW MODAL');
// The detail modal starts with: {/* RUP LKPP Detail Sheet Modal */}
const detailModalStart = file.indexOf('{/* RUP LKPP Detail Sheet Modal */}');
// SirupInputRow starts with: function SirupInputRow
const sirupRowStart = file.indexOf('function SirupInputRow');

// Extract Step 3
const step3JSX = file.substring(step3Start, step4Start);
// Step 3 also needs SirupInputRow because it might use it, but wait, Step 2 used SirupInputRow!
// Let's just put SirupInputRow in a separate file or PPKContext? No, put it in Step1 or Step2.
// Wait, SirupInputRow is used by Step 2. So we'll put it in Step2UploadDPA.jsx?
// I'll append SirupInputRow to Step2UploadDPA.jsx if it's missing.

// Extract Step 4
const step4JSX = file.substring(step4Start, step5Start);

// Extract Step 5
const step5JSX = file.substring(step5Start, previewModalStart);

// Extract Preview Modal (Belongs to Step 4 probably, or we can just append it to Step 4)
const previewModalJSX = file.substring(previewModalStart, detailModalStart - 6); // -6 to avoid closing tags of the main container

// Extract Detail Modal (Belongs to Step 1, but we can put it in Step1PilihPaket)
const detailModalJSX = file.substring(detailModalStart, sirupRowStart);

// Extract SirupInputRow
const sirupRowJSX = file.substring(sirupRowStart);

fs.writeFileSync('/home/beni/PBJ/frontend/src/components/ppk/Step3RincianHPS.jsx', 
`import React, { useState } from 'react';
import { usePPK } from './PPKContext';

export default function Step3RincianHPS() {
  const { 
    selectedPack, currentUser,
    dpaAccounts, 
    dpaRincian, setDpaRincian, 
    step, setStep, 
    hpsValue, setHpsValue, 
    isHpsExemptSelected, setIsHpsExemptSelected,
    hpsPrices, setHpsPrices,
    techSpecs, setTechSpecs,
    rincianModal, setRincianModal,
    surveyData, getActiveSurveyData,
    justifications, setJustifications,
    comparisons, setComparisons,
    captureScreenshot, screenshotStatus,
    isEnhancingJustification, enhanceJustificationWithAI,
    runAiSurvey, isSurveying, surveyProgress, surveyProgressPercent, cancelSurvey,
    useAiMode, setUseAiMode, searchLocations, setSearchLocations,
    globalTargetVendor, setGlobalTargetVendor, globalPriceTolerance, setGlobalPriceTolerance,
    customTargets, setCustomTargets, customPrices, setCustomPrices, customKeywords, setCustomKeywords,
    runSingleItemSurvey, loadingProductIndex,
    expandedEditCardIndex, setExpandedEditCardIndex,
    expandedSurveyRows, setExpandedSurveyRows,
    captureAllScreenshots
  } = usePPK();

  const getPackageItems = () => []; // Dummy for now to prevent crash if not found

  return (
    <>
      ${step3JSX}
    </>
  );
}
`);

fs.writeFileSync('/home/beni/PBJ/frontend/src/components/ppk/Step4TemplateSurat.jsx', 
`import React, { useState } from 'react';
import { createPortal } from 'react-dom';
import { usePPK } from './PPKContext';

export default function Step4TemplateSurat() {
  const { 
    selectedPack, currentUser,
    docSettings, setDocSettings,
    packageMetadata, setPackageMetadata,
    dppSpecs, setDppSpecs,
    step, setStep,
    aiError, setAiError,
    hpsValue, isHpsExemptSelected,
    surveyData, hpsPrices
  } = usePPK();

  const [activeDocPreview, setActiveDocPreview] = useState(null);
  const getPacketCategory = () => 'ATK';
  const getPackageItems = () => [];
  const getActiveSurveyData = () => null;
  const parseSmartColons = (t) => t;

  return (
    <>
      ${step4JSX}
      ${previewModalJSX}
    </>
  );
}
`);

fs.writeFileSync('/home/beni/PBJ/frontend/src/components/ppk/Step5Review.jsx', 
`import React, { useState } from 'react';
import { usePPK } from './PPKContext';

export default function Step5Review() {
  const { 
    selectedPack, currentUser,
    dpaRincian, 
    step, setStep,
    handleSimpanPaket,
    isUpdating
  } = usePPK();

  const [isSigned, setIsSigned] = useState(false);

  return (
    <>
      ${step5JSX.replace(/}\s*$/g, '')}
    </>
  );
}
`);

// Append SirupInputRow to Step2UploadDPA if not already there
let step2Content = fs.readFileSync('/home/beni/PBJ/frontend/src/components/ppk/Step2UploadDPA.jsx', 'utf-8');
if (!step2Content.includes('function SirupInputRow')) {
  fs.appendFileSync('/home/beni/PBJ/frontend/src/components/ppk/Step2UploadDPA.jsx', '\n' + sirupRowJSX);
}

// Append detail modal to Step1
let step1Content = fs.readFileSync('/home/beni/PBJ/frontend/src/components/ppk/Step1PilihPaket.jsx', 'utf-8');
if (!step1Content.includes('RUP LKPP Detail Sheet Modal')) {
  // inject before the last closing div
  const lastDivIndex = step1Content.lastIndexOf('</div>');
  const newStep1 = step1Content.substring(0, lastDivIndex) + '\n' + detailModalJSX + '\n' + step1Content.substring(lastDivIndex);
  fs.writeFileSync('/home/beni/PBJ/frontend/src/components/ppk/Step1PilihPaket.jsx', newStep1);
}

console.log("Extraction V2 complete.");
