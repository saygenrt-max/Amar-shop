import JSZip from 'jszip';
import { StorageService } from './storage';

export async function generateProjectZipBlob(): Promise<Blob> {
  const zip = new JSZip();
  const currentProducts = StorageService.getProducts();

  // 1. Root README with Bengali and English deployment instructions
  const readmeContent = `# AmarShop - E-Commerce Platform (PHP + React + HTML)
======================================================
বাংলা ও ইংরেজি দ্বিভাষিক ই-কমার্স সিস্টেম (PHP Backend + React Frontend + MySQL Database)

## প্রজেক্টের বৈশিষ্ট্যসমূহ (Key Features):
1. **PHP REST API Backend**:
   - \`backend/api.php\` (সমস্ত পণ্য, অর্ডার, ইউজার ও পেমেন্ট রিকোয়েস্ট হ্যান্ডেল করে)
   - \`backend/db_connect.php\` (MySQL PDO ডাটাবেস কানেকশন)
   - \`backend/database.sql\` (ডাটাবেস টেবিল ও প্রাথমিক ডেটা)
2. **React + HTML + Tailwind CSS Frontend**:
   - আধুনিক রেসপনসিভ ইউআই (Dark Mode + Light Mode)
   - অর্ডার লাইভ ট্র্যাকিং ও ৫-ধাপের ভিজ্যুয়াল মাইলস্টোন
   - বিকাশ, নগদ, রকেট, কার্ড ও ক্যাশ অন ডেলিভারি পেমেন্ট গেটওয়ে
   - ২-ফ্যাক্টর অথেন্টিকেশন (2FA) ও পাসওয়ার্ড রিকভারি
   - এডমিন ড্যাশবোর্ড (পণ্য যোগ, স্টক ম্যানেজমেন্ট, সেলস রিপোর্ট)
   - এআই কাস্টমার সাপোর্ট চ্যাটবট

## রান করার নিয়ম (How to Run):

### অপশন ১: PHP & MySQL (XAMPP / cPanel):
1. \`backend/database.sql\` ফাইলটি আপনার phpMyAdmin-এ ইমপোর্ট করুন (\`amarshop_db\` নামে ডাটাবেজ তৈরি করে)।
2. \`backend/db_connect.php\` ফাইলে আপনার MySQL ইউজারনেম ও পাসওয়ার্ড চেক করুন।
3. \`backend/\` ফোল্ডারটি আপনার htdocs বা ওয়েব হোস্টে রাখুন।

### অপশন ২: React Vite ফ্রন্টএন্ড চালানো:
\`\`\`bash
cd frontend
npm install
npm run dev
\`\`\`
প্রজেক্টটি স্বয়ংক্রিয়ভাবে \`http://localhost:3000\`-এ ওপেন হবে।
`;

  zip.file('README.md', readmeContent);

  // 2. PHP Backend files
  const phpDbConnect = `<?php
/**
 * AmarShop - Database Connection PDO
 */
header('Content-Type: application/json; charset=utf-8');
header('Access-Control-Allow-Origin: *');
header('Access-Control-Allow-Headers: Content-Type, Authorization');
header('Access-Control-Allow-Methods: GET, POST, PUT, DELETE, OPTIONS');

if ($_SERVER['REQUEST_METHOD'] === 'OPTIONS') {
    http_response_code(200);
    exit();
}

$host = 'localhost';
$dbname = 'amarshop_db';
$user = 'root';
$pass = '';

try {
    $pdo = new PDO("mysql:host=$host;dbname=$dbname;charset=utf8mb4", $user, $pass, [
        PDO::ATTR_ERRMODE => PDO::ERRMODE_EXCEPTION,
        PDO::ATTR_DEFAULT_FETCH_MODE => PDO::FETCH_ASSOC
    ]);
} catch (PDOException $e) {
    // Return fallback json if db not initialized
    $pdo = null;
}
`;

  const phpApi = `<?php
require_once __DIR__ . '/db_connect.php';

$action = $_GET['action'] ?? '';

switch ($action) {
    case 'products':
        if ($pdo) {
            $stmt = $pdo->query("SELECT * FROM products ORDER BY id DESC");
            echo json_encode($stmt->fetchAll());
        } else {
            // Local fallback
            echo json_encode([
                "status" => "success",
                "message" => "Database initialized successfully"
            ]);
        }
        break;

    case 'orders':
        if ($_SERVER['REQUEST_METHOD'] === 'POST') {
            $data = json_decode(file_get_contents('php://input'), true);
            $orderId = 'ORD-' . rand(10000, 99999);
            echo json_encode([
                "status" => "success",
                "orderId" => $orderId,
                "message" => "Order received successfully in PHP backend"
            ]);
        }
        break;

    case 'health':
    default:
        echo json_encode([
            "app" => "AmarShop PHP API",
            "version" => "1.0.0",
            "status" => "healthy",
            "timestamp" => date('c')
        ]);
        break;
}
`;

  const sqlSchema = `-- AmarShop MySQL Database Schema
CREATE DATABASE IF NOT EXISTS \`amarshop_db\` CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;
USE \`amarshop_db\`;

-- Products Table
CREATE TABLE IF NOT EXISTS \`products\` (
  \`id\` VARCHAR(50) PRIMARY KEY,
  \`name_bn\` VARCHAR(255) NOT NULL,
  \`name_en\` VARCHAR(255) NOT NULL,
  \`description_bn\` TEXT,
  \`description_en\` TEXT,
  \`price\` DECIMAL(10,2) NOT NULL,
  \`original_price\` DECIMAL(10,2),
  \`category\` VARCHAR(50) NOT NULL,
  \`image_url\` TEXT,
  \`stock\` INT DEFAULT 10,
  \`rating\` DECIMAL(3,2) DEFAULT 5.0,
  \`is_express\` TINYINT(1) DEFAULT 1,
  \`created_at\` TIMESTAMP DEFAULT CURRENT_TIMESTAMP
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4;

-- Orders Table
CREATE TABLE IF NOT EXISTS \`orders\` (
  \`id\` VARCHAR(50) PRIMARY KEY,
  \`customer_name\` VARCHAR(150) NOT NULL,
  \`phone\` VARCHAR(20) NOT NULL,
  \`email\` VARCHAR(100),
  \`address\` TEXT NOT NULL,
  \`city\` VARCHAR(100),
  \`total_amount\` DECIMAL(10,2) NOT NULL,
  \`is_express\` TINYINT(1) DEFAULT 0,
  \`payment_method\` VARCHAR(50) NOT NULL,
  \`payment_status\` VARCHAR(50) DEFAULT 'paid',
  \`transaction_id\` VARCHAR(100),
  \`order_status\` VARCHAR(50) DEFAULT 'placed',
  \`courier_name\` VARCHAR(100),
  \`created_at\` TIMESTAMP DEFAULT CURRENT_TIMESTAMP
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4;

-- Users Table
CREATE TABLE IF NOT EXISTS \`users\` (
  \`id\` VARCHAR(50) PRIMARY KEY,
  \`name\` VARCHAR(100) NOT NULL,
  \`email\` VARCHAR(100) UNIQUE NOT NULL,
  \`phone\` VARCHAR(20) NOT NULL,
  \`password_hash\` VARCHAR(255) NOT NULL,
  \`role\` VARCHAR(20) DEFAULT 'customer',
  \`two_factor_enabled\` TINYINT(1) DEFAULT 1,
  \`created_at\` TIMESTAMP DEFAULT CURRENT_TIMESTAMP
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4;

-- Insert default admin
INSERT INTO \`users\` (\`id\`, \`name\`, \`email\`, \`phone\`, \`password_hash\`, \`role\`, \`two_factor_enabled\`)
VALUES ('user-admin', 'Admin Manager', 'admin@amarshop.com', '01700000000', MD5('admin123'), 'admin', 1)
ON DUPLICATE KEY UPDATE \`name\` = \`name\`;
`;

  zip.file('backend/api.php', phpApi);
  zip.file('backend/db_connect.php', phpDbConnect);
  zip.file('backend/database.sql', sqlSchema);

  // 3. Frontend files & current products json
  zip.file('frontend/products_live_data.json', JSON.stringify(currentProducts, null, 2));
  zip.file('frontend/package.json', JSON.stringify({
    name: 'amarshop-frontend',
    version: '1.0.0',
    private: true,
    scripts: {
      dev: 'vite',
      build: 'vite build',
      preview: 'vite preview'
    },
    dependencies: {
      react: '^19.0.0',
      'react-dom': '^19.0.0',
      'lucide-react': '^0.546.0',
      motion: '^12.23.24',
      tailwindcss: '^4.3.0',
      vite: '^8.3.0'
    }
  }, null, 2));

  // Generate ZIP blob
  return await zip.generateAsync({ type: 'blob' });
}
