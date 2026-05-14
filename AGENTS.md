<!-- BEGIN:nextjs-agent-rules -->
# This is NOT the Next.js you know

This version has breaking changes — APIs, conventions, and file structure may all differ from your training data. Read the relevant guide in `node_modules/next/dist/docs/` before writing any code. Heed deprecation notices.
<!-- END:nextjs-agent-rules -->

# Security Rules

NEVER commit or push sensitive files, secrets, or credentials to GitHub.

Forbidden files:
- .env
- .env.local
- .env.production
- .env.* 
- service-account.json
- firebase-admin.json
- secrets.json
- private keys
- SSH keys
- Supabase service role keys
- API keys
- Redis credentials

Before every git commit or push:
1. Check git diff
2. Check git status
3. Verify no sensitive files are staged
4. Ensure .gitignore is respected

If sensitive files are detected:
- STOP immediately
- Warn the user
- Do NOT commit or push