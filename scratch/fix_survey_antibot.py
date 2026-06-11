import re

with open('/home/beni/PBJ/survey-service/server.js', 'r') as f:
    content = f.read()

# 1. Add Helper Functions
helpers = """
// --- ANTI-BOT HELPERS ---
const USER_AGENTS = [
  'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/120.0.0.0 Safari/537.36',
  'Mozilla/5.0 (Macintosh; Intel Mac OS X 10_15_7) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/119.0.0.0 Safari/537.36',
  'Mozilla/5.0 (Windows NT 10.0; Win64; x64; rv:109.0) Gecko/20100101 Firefox/121.0',
  'Mozilla/5.0 (Macintosh; Intel Mac OS X 10.15; rv:109.0) Gecko/20100101 Firefox/121.0',
  'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/120.0.0.0 Safari/537.36 Edg/120.0.0.0',
];

async function randomDelay(min, max) {
  const ms = Math.floor(Math.random() * (max - min + 1)) + min;
  return new Promise(r => setTimeout(r, ms));
}

async function autoScroll(page) {
  try {
    await page.evaluate(async () => {
      await new Promise((resolve) => {
        let totalHeight = 0;
        let distance = 150;
        let timer = setInterval(() => {
          let scrollHeight = document.body.scrollHeight;
          window.scrollBy(0, distance);
          totalHeight += distance;
          if (totalHeight >= scrollHeight - window.innerHeight || totalHeight > 5000) {
            clearInterval(timer);
            resolve();
          }
        }, 120);
      });
    });
  } catch (e) {
    // Ignore scroll errors
  }
}
// -----------------------
"""
if "ANTI-BOT HELPERS" not in content:
    content = content.replace("const app = express();", helpers + "\nconst app = express();")

# 2. Replace static UserAgent with random one
content = re.sub(
    r"await page\.setUserAgent\([^)]+\);",
    "await page.setUserAgent(USER_AGENTS[Math.floor(Math.random() * USER_AGENTS.length)]);",
    content
)

# 3. Replace fixed 4000ms delay with random delay and scroll
content = content.replace(
    "await new Promise(r => setTimeout(r, 4000));",
    "await randomDelay(3500, 6500); await autoScroll(page);"
)

# 4. Make sure args includes --disable-blink-features=AutomationControlled
def repl_args(match):
    args_str = match.group(1)
    if 'AutomationControlled' not in args_str:
        return f"args: {args_str[:-1]}, '--disable-blink-features=AutomationControlled']"
    return match.group(0)

content = re.sub(r"args:\s*(\[[^\]]+\])", repl_args, content)

with open('/home/beni/PBJ/survey-service/server.js', 'w') as f:
    f.write(content)

print("Berhasil dimodifikasi")
