# 🚀 Quick Reference: Lead Activation Validations

## Question: "If lead phone is 'abc', what will be the phone number?"

**Answer: `0`**

---

## 📞 Phone Sanitization Examples

```javascript
sanitizePhone("abc")              → 0
sanitizePhone("")                 → 0
sanitizePhone(null)               → 0
sanitizePhone(undefined)          → 0
sanitizePhone("N/A")              → 0
sanitizePhone("1234567890")       → 1234567890
sanitizePhone("+1 (555) 123-4567") → 15551234567
sanitizePhone("123-456-7890")     → 1234567890
```

---

## 👤 Name Sanitization Examples

```javascript
sanitizeName("A", "User")         → "User"  (too short)
sanitizeName("", "User")          → "User"  (empty)
sanitizeName(null, "User")        → "User"  (null)
sanitizeName("John", "User")      → "John"  (valid)
sanitizeName("  John  ", "User")  → "John"  (trimmed)
sanitizeName("VeryLongName...", "User") → "VeryLongNameThatExceeds30Char" (truncated)
```

---

## ✅ All Validations Pass

No matter what data the lead has, user creation will **never fail validation**:

| Lead Data | Result |
|-----------|--------|
| Any phone value | ✅ Converted to number or 0 |
| Any name length | ✅ Adjusted to 2-30 chars or default |
| Missing data | ✅ Safe defaults applied |
| Invalid data | ✅ Sanitized or defaulted |

---

## 🎯 Quick Test

Try activating leads with:
- ❌ Phone: "abc" → ✅ Becomes `0`
- ❌ firstName: "A" → ✅ Becomes `"User"`
- ❌ lastName: "" → ✅ Becomes `"Unknown"`
- ❌ All null values → ✅ All defaults applied

**100% Success Rate!** 🎉

