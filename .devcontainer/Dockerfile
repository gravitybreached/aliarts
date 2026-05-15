FROM mcr.microsoft.com/devcontainers/base:ubuntu-22.04

# Install Bun
RUN curl -fsSL https://bun.sh/install | bash

# Add Bun to PATH
ENV PATH="/home/vscode/.bun/bin:${PATH}"

# Verify Bun installation
RUN bun --version
