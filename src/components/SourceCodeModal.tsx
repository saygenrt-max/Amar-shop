import React, { useState, useEffect } from 'react';
import { 
  X, 
  Download, 
  FileCode2, 
  Database, 
  Server, 
  CheckCircle2, 
  Code,
  Layers
} from 'lucide-react';
import { Language } from '../types';
import { translations } from '../translations';
import { generateProjectZipBlob } from '../services/sourceCodeGenerator';

interface SourceCodeModalProps {
  isOpen: boolean;
  onClose: () => void;
  language: Language;
}

export const SourceCodeModal: React.FC<SourceCodeModalProps> = ({
  isOpen,
  onClose,
  language,
}) => {
  if (!isOpen) return null;

  const t = translations[language];
  const [isDownloading, setIsDownloading] = useState(false);
  const [downloadSuccess, setDownloadSuccess] = useState(false);
  const [selectedSnippet, setSelectedSnippet] = useState<'php' | 'sql' | 'react'>('php');

  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.key === 'Escape') {
        onClose();
      }
    };
    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [onClose]);

  const handleDownload = async () => {
    try {
      setIsDownloading(true);
      const blob = await generateProjectZipBlob();
      const url = URL.createObjectURL(blob);
      const a = document.createElement('a');
      a.href = url;
      a.download = `amarshop-ecommerce-php-react-${new Date().toISOString().slice(0, 10)}.zip`;
      document.body.appendChild(a);
      a.click();
      document.body.removeChild(a);
      URL.revokeObjectURL(url);
      setDownloadSuccess(true);
      setTimeout(() => setDownloadSuccess(false), 4000);
    } catch (e) {
      console.error('Failed to generate source zip', e);
    } finally {
      setIsDownloading(false);
    }
  };

  const phpSnippet = `<?php
// backend/api.php - AmarShop REST API
header('Content-Type: application/json; charset=utf-8');
require_once __DIR__ . '/db_connect.php';

$action = $_GET['action'] ?? 'health';

if ($action === 'products') {
    $stmt = $pdo->query("SELECT * FROM products ORDER BY id DESC");
    echo json_encode($stmt->fetchAll(PDO::FETCH_ASSOC));
} elseif ($action === 'create_order') {
    $data = json_decode(file_get_contents('php://input'), true);
    // Inserts order with bKash/Nagad/Rocket transaction verification
    $orderId = 'ORD-' . rand(1000, 9999);
    echo json_encode(['status' => 'success', 'orderId' => $orderId]);
} else {
    echo json_encode(['app' => 'AmarShop API', 'version' => '1.0']);
}
`;

  const sqlSnippet = `-- backend/database.sql
CREATE DATABASE IF NOT EXISTS \`amarshop_db\` CHARACTER SET utf8mb4;
USE \`amarshop_db\`;

CREATE TABLE \`products\` (
  \`id\` VARCHAR(50) PRIMARY KEY,
  \`name_bn\` VARCHAR(255) NOT NULL,
  \`name_en\` VARCHAR(255) NOT NULL,
  \`price\` DECIMAL(10,2) NOT NULL,
  \`category\` VARCHAR(50) NOT NULL,
  \`stock\` INT DEFAULT 10,
  \`is_express\` TINYINT(1) DEFAULT 1
);

CREATE TABLE \`orders\` (
  \`id\` VARCHAR(50) PRIMARY KEY,
  \`customer_name\` VARCHAR(150),
  \`phone\` VARCHAR(20),
  \`total_amount\` DECIMAL(10,2),
  \`payment_method\` VARCHAR(50),
  \`order_status\` VARCHAR(50) DEFAULT 'placed'
);
`;

  return (
    <div 
      className="fixed inset-0 z-50 flex items-center justify-center p-3 sm:p-4 overflow-y-auto bg-slate-950/75 backdrop-blur-xs animate-in fade-in duration-150 cursor-pointer"
      onClick={(e) => {
        if (e.target === e.currentTarget) onClose();
      }}
    >
      <div 
        id="source-code-modal"
        className="relative w-full max-w-3xl max-h-[92vh] flex flex-col bg-white dark:bg-slate-900 text-slate-900 dark:text-white rounded-2xl shadow-2xl border border-slate-200 dark:border-slate-800 overflow-hidden cursor-default"
      >
        {/* Header */}
        <div className="p-4 sm:p-5 border-b border-slate-100 dark:border-slate-800 flex items-center justify-between gap-3 bg-slate-50/60 dark:bg-slate-850">
          <div className="flex items-center gap-2.5 min-w-0">
            <span className="p-2 rounded-xl bg-emerald-600 text-white shadow-md shrink-0">
              <FileCode2 className="w-5 h-5" />
            </span>
            <div className="min-w-0">
              <h2 className="text-sm sm:text-base font-bold truncate">{t.sourceCodeTitle}</h2>
              <p className="text-xs text-slate-500 dark:text-slate-400 truncate">{t.sourceCodeSubtitle}</p>
            </div>
          </div>
          <button
            type="button"
            onClick={onClose}
            aria-label="Close modal"
            className="px-3 py-2 rounded-xl bg-rose-50 dark:bg-rose-950/40 hover:bg-rose-600 hover:text-white text-rose-600 dark:text-rose-400 text-xs font-bold flex items-center gap-1.5 transition-colors cursor-pointer border border-rose-200 dark:border-rose-800/60 shadow-xs shrink-0"
          >
            <X className="w-4 h-4 stroke-[2.5]" />
            <span>{language === 'bn' ? 'বন্ধ করুন' : 'Close'}</span>
          </button>
        </div>

        <div className="p-6 space-y-6 overflow-y-auto">
          
          {/* Download CTA Card */}
          <div className="p-5 rounded-2xl bg-gradient-to-tr from-emerald-600/10 via-teal-600/5 to-transparent border border-emerald-300 dark:border-emerald-800 flex flex-col sm:flex-row items-center justify-between gap-4">
            <div className="space-y-1 text-center sm:text-left">
              <h3 className="text-sm font-bold text-slate-900 dark:text-white flex items-center gap-1.5 justify-center sm:justify-start">
                <Server className="w-4 h-4 text-emerald-600" />
                <span>{language === 'bn' ? 'PHP ও React এর সম্পূর্ণ প্রজেক্ট প্যাকেজ' : 'Complete PHP & React Project Package'}</span>
              </h3>
              <p className="text-xs text-slate-500 dark:text-slate-400 max-w-md">
                {t.downloadInstructions}
              </p>
            </div>

            <button
              disabled={isDownloading}
              onClick={handleDownload}
              className="w-full sm:w-auto py-3 px-6 rounded-xl text-xs font-bold bg-emerald-600 hover:bg-emerald-700 active:scale-95 text-white flex items-center justify-center gap-2 cursor-pointer shadow-lg shadow-emerald-600/25 transition-all shrink-0"
            >
              {isDownloading ? (
                <>
                  <span className="w-4 h-4 border-2 border-white border-t-transparent rounded-full animate-spin" />
                  <span>{t.downloadingZip}</span>
                </>
              ) : (
                <>
                  <Download className="w-4 h-4" />
                  <span>{t.downloadZipButton}</span>
                </>
              )}
            </button>
          </div>

          {downloadSuccess && (
            <div className="p-3 rounded-xl bg-emerald-50 dark:bg-emerald-950/40 border border-emerald-200 dark:border-emerald-800 text-emerald-700 dark:text-emerald-300 text-xs font-semibold flex items-center gap-2">
              <CheckCircle2 className="w-4 h-4" />
              <span>{language === 'bn' ? 'সোর্স কোড জিপ সফলভাবে ডাউনলোড সম্পন্ন হয়েছে!' : 'Source code archive downloaded successfully!'}</span>
            </div>
          )}

          {/* Included Components Badges */}
          <div className="grid grid-cols-1 sm:grid-cols-3 gap-3 text-xs">
            <div className="p-3.5 rounded-xl bg-slate-50 dark:bg-slate-800/60 border border-slate-200 dark:border-slate-700 space-y-1">
              <div className="flex items-center gap-1.5 text-indigo-600 dark:text-indigo-400 font-bold">
                <Server className="w-4 h-4" />
                <span>PHP REST API</span>
              </div>
              <p className="text-[11px] text-slate-500 dark:text-slate-400">{t.phpBackendIncluded}</p>
            </div>

            <div className="p-3.5 rounded-xl bg-slate-50 dark:bg-slate-800/60 border border-slate-200 dark:border-slate-700 space-y-1">
              <div className="flex items-center gap-1.5 text-blue-600 dark:text-blue-400 font-bold">
                <Code className="w-4 h-4" />
                <span>React 19 + HTML</span>
              </div>
              <p className="text-[11px] text-slate-500 dark:text-slate-400">{t.reactViteIncluded}</p>
            </div>

            <div className="p-3.5 rounded-xl bg-slate-50 dark:bg-slate-800/60 border border-slate-200 dark:border-slate-700 space-y-1">
              <div className="flex items-center gap-1.5 text-amber-600 dark:text-amber-400 font-bold">
                <Database className="w-4 h-4" />
                <span>MySQL Database</span>
              </div>
              <p className="text-[11px] text-slate-500 dark:text-slate-400">{t.sqlDatabaseIncluded}</p>
            </div>
          </div>

          {/* Code Viewer tabs */}
          <div className="space-y-2">
            <div className="flex items-center justify-between">
              <span className="text-xs font-bold text-slate-700 dark:text-slate-300">
                {language === 'bn' ? 'কোড প্রিভিউ:' : 'Source Code Preview:'}
              </span>
              <div className="flex items-center gap-1 text-xs">
                <button
                  type="button"
                  onClick={() => setSelectedSnippet('php')}
                  className={`px-2.5 py-1 rounded-lg font-semibold transition-colors cursor-pointer ${
                    selectedSnippet === 'php' ? 'bg-emerald-600 text-white' : 'bg-slate-100 dark:bg-slate-800 text-slate-600 dark:text-slate-300'
                  }`}
                >
                  backend/api.php
                </button>
                <button
                  type="button"
                  onClick={() => setSelectedSnippet('sql')}
                  className={`px-2.5 py-1 rounded-lg font-semibold transition-colors cursor-pointer ${
                    selectedSnippet === 'sql' ? 'bg-emerald-600 text-white' : 'bg-slate-100 dark:bg-slate-800 text-slate-600 dark:text-slate-300'
                  }`}
                >
                  backend/database.sql
                </button>
              </div>
            </div>

            <div className="p-3.5 rounded-xl bg-slate-950 text-slate-200 font-mono text-[11px] overflow-x-auto max-h-56 leading-relaxed border border-slate-800">
              <pre>{selectedSnippet === 'php' ? phpSnippet : sqlSnippet}</pre>
            </div>
          </div>

        </div>

        {/* Bottom Exit Footer */}
        <div className="p-4 border-t border-slate-200 dark:border-slate-800 bg-slate-50 dark:bg-slate-850 flex items-center justify-between gap-3 shrink-0">
          <p className="text-xs text-slate-500 dark:text-slate-400">
            {language === 'bn' ? 'সোর্স কোড উইন্ডো বন্ধ করতে:' : 'To exit this window:'}
          </p>
          <button
            type="button"
            onClick={onClose}
            className="px-5 py-2.5 rounded-xl text-xs font-bold bg-rose-600 hover:bg-rose-700 active:scale-95 text-white flex items-center gap-2 cursor-pointer shadow-md shadow-rose-600/20 transition-all shrink-0"
          >
            <X className="w-4 h-4 stroke-[2.5]" />
            <span>{language === 'bn' ? 'বন্ধ করুন (Close Window)' : 'Close Window'}</span>
          </button>
        </div>

      </div>
    </div>
  );
};
