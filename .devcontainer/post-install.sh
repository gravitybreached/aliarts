#!/bin/bash
# Post-create setup script for GitHub Codespaces - AliArts
set -e

echo "🔧 Setting up AliArts development environment..."

# ---------------------------------------------------------------------------
# 1. Ensure bun is on PATH for this script session.
#    The devcontainer feature installs bun to ~/.bun/bin but the PATH
#    export only takes effect in interactive login shells — not in the
#    non-interactive shell that postCreateCommand runs in.
#    We source it explicitly here so everything below can find `bun`.
# ---------------------------------------------------------------------------
export PATH="$HOME/.bun/bin:$PATH"

# If still missing (feature failed), install bun manually
if ! command -v bun &> /dev/null; then
    echo "📦 Bun not found, installing manually..."
    curl -fsSL https://bun.sh/install | bash
    export PATH="$HOME/.bun/bin:$PATH"
fi

echo "✅ Bun found: $(bun --version)"

# ---------------------------------------------------------------------------
# 2. Persist PATH for every future interactive terminal session.
#    Write to both .bashrc (bash) and .zshrc (zsh, used by Codespaces default).
#    Guard against duplicate entries.
# ---------------------------------------------------------------------------
BUN_PATH_LINE='export PATH="$HOME/.bun/bin:$PATH"'

for PROFILE in "$HOME/.bashrc" "$HOME/.zshrc" "$HOME/.profile"; do
    if [ -f "$PROFILE" ] || [ "$PROFILE" = "$HOME/.profile" ]; then
        if ! grep -qF '.bun/bin' "$PROFILE" 2>/dev/null; then
            echo "$BUN_PATH_LINE" >> "$PROFILE"
        fi
    fi
done

# ---------------------------------------------------------------------------
# 3. Install dependencies
# ---------------------------------------------------------------------------
echo "📦 Installing dependencies..."
bun install

# ---------------------------------------------------------------------------
# 4. Generate Prisma Client
# ---------------------------------------------------------------------------
echo "🗄️ Generating Prisma Client..."
bun run db:generate

echo ""
echo "✅ Setup complete!"
echo "   Run 'bun run dev' to start the dev server on port 3000"
