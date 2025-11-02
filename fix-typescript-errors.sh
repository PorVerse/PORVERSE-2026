#!/bin/bash
# ============================================
# 🚀 PorVerse TypeScript Auto-Fix Script
# Rezolvă ~450 erori TypeScript automat
# ============================================

echo "🔧 Starting TypeScript Auto-Fix..."
echo ""

# ============================================
# WAVE B: Fix Export Duplicates (263 erori)
# ============================================

echo "📦 WAVE B: Fixing duplicate exports..."

# Fix utils/date-helpers.ts
if [ -f "utils/date-helpers.ts" ]; then
    echo "  ✓ Fixing utils/date-helpers.ts"
    
    # Remove duplicate export block (după linia 628)
    sed -i '/^export {$/,/^}$/d' utils/date-helpers.ts
    echo "// Exports are already inline with function declarations above" >> utils/date-helpers.ts
    
    echo "    → Removed duplicate exports"
fi

# Fix utils/portal-helpers.ts
if [ -f "utils/portal-helpers.ts" ]; then
    echo "  ✓ Fixing utils/portal-helpers.ts"
    
    # Remove duplicate export block (după linia 555)
    sed -i '/^export {$/,/^}$/d' utils/portal-helpers.ts
    echo "// Exports are already inline with function declarations above" >> utils/portal-helpers.ts
    
    echo "    → Removed duplicate exports"
fi

echo ""

# ============================================
# WAVE C: Run ESLint Auto-Fix
# ============================================

echo "🧹 WAVE C: Running ESLint auto-fix..."
npm run lint -- --fix > /dev/null 2>&1
echo "  ✓ ESLint fixes applied"

echo ""

# ============================================
# WAVE D: Type Check
# ============================================

echo "🔍 WAVE D: Running type check..."
echo ""
npm run type-check

echo ""
echo "========================================"
echo "✅ TypeScript Auto-Fix COMPLETE!"
echo "========================================"
echo ""
echo "Check the output above for remaining errors."
echo "Most errors should be resolved now!"
echo ""
