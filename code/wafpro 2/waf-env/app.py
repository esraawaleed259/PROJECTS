from flask import Flask, request, jsonify, render_template, redirect
import re
from datetime import datetime
from collections import Counter

app = Flask(__name__)

# List to store logs in memory
logs = []

# File path to save logs
log_file_path = 'logs.txt'

# List of attack patterns (SQLi, XSS, Command Injection, Path Traversal, RFI, XXE, OS Commands)
attack_patterns = [
    r"(?i)(union\s+select)",
    r"(?i)(drop\s+table)",
    r"(?i)(['\"]?\s*or\s*['\"]?1['\"]?\s*=\s*['\"]?1['\"]?)",
    r"(--|;--|\bexec\b|\binsert\b|\bdelete\b|\bupdate\b)",
    r"(?i)<script.*?>.*?</script>",
    r"(?i)<img\s+.*?onerror\s*=.*?>",
    r"(?i)<svg\s+.*?onload\s*=.*?>",
    r"javascript:",
    r"(\||;|&&)\s*(ls|cat|whoami|pwd|id)",
    r"(?i)(rm\s+-rf|powershell|cmd\.exe|bash\s+-i)",
    r"(\.\./){2,}",
    r"/etc/passwd",
    r"c:\\windows\\system32",
    r"(http|https|ftp):\/\/[^\s]+",
    r"<!ENTITY\s+.*?SYSTEM",
    r"(?i)xp_cmdshell",
    r"(?i)net\s+user",
]

# Function to normalize input before checking
def normalize_input(data: str) -> str:
    # Convert to lowercase
    data = data.lower()
    # Remove extra whitespaces
    data = re.sub(r"\s+", " ", data)
    # Remove SQL comments
    data = re.sub(r"--.*", "", data)
    return data.strip()

# Function to check if input matches any attack pattern
def is_attack(data):
    normalized = normalize_input(data)
    for pattern in attack_patterns:
        if re.search(pattern, normalized):
            return True
    return False

# Function to write log to file
def write_log_to_file(log):
    with open(log_file_path, 'a', encoding='utf-8') as f:
        f.write(f"{log['timestamp']} | {log['status']} | {log['data']}\n")

# Route for home page
@app.route('/')
def index():
    return render_template('index.html')

# Route to submit payloads
@app.route('/submit', methods=['POST'])
def submit():
    data = request.get_json(force=True) or {}
    payload = data.get('request', '')

    # Check if the payload is an attack
    attack_found = is_attack(payload)
    status = "attack" if attack_found else "safe"
    message = "Attack detected!" if attack_found else "Data safe."

    # Create log entry
    log_entry = {
        "timestamp": datetime.now().isoformat(),
        "data": payload,
        "status": status
    }

    # Save log in memory and file
    logs.append(log_entry)
    write_log_to_file(log_entry)

    return jsonify({"message": message, "status": status})

# Route to view logs
@app.route('/logs')
def show_logs():
    attack_count = len([log for log in logs if log['status'] == 'attack'])
    safe_count = len([log for log in logs if log['status'] == 'safe'])
    # Top 5 attack payloads
    top_payloads = Counter([log['data'] for log in logs if log['status'] == 'attack']).most_common(5)

    return render_template('logs.html',
                           logs=logs,
                           attack_count=attack_count,
                           safe_count=safe_count,
                           top_payloads=top_payloads)

# Admin page
@app.route('/admin')
def admin():
    return render_template('admin.html', logs=logs)

# Route to clear logs
@app.route('/clear-logs', methods=['POST'])
def clear_logs():
    logs.clear()
    with open(log_file_path, 'w', encoding='utf-8') as f:
        f.write('')
    return redirect('/logs')

# Run the Flask app
if __name__ == '__main__':
    app.run(debug=True, host='0.0.0.0', port=4000)
