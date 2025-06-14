# Quick Reference: Localhost OAuth Configuration

## Google Cloud Console Settings

### Authorized JavaScript Origins
```
http://localhost:3000
```

### Authorized Redirect URIs  
```
http://localhost:3000/auth/callback
```

## Supabase Dashboard Settings

### Site URL
```
http://localhost:3000
```

### Additional Redirect URLs
```
http://localhost:3000/auth/callback
```

## Testing Checklist

- [ ] Google Cloud Console has `http://localhost:3000` in Authorized JavaScript origins
- [ ] Google Cloud Console has `http://localhost:3000/auth/callback` in Authorized redirect URIs
- [ ] Supabase has `http://localhost:3000` as Site URL
- [ ] Supabase has `http://localhost:3000/auth/callback` in Additional redirect URLs
- [ ] Development server is running on port 3000
- [ ] Testing in incognito/private browser window
- [ ] No trailing slashes in any URLs
- [ ] Using `http://` not `https://` for localhost

## Common Errors and Solutions

### `redirect_uri_mismatch`
- Check that redirect URI in Google Cloud Console exactly matches `http://localhost:3000/auth/callback`
- Ensure no trailing slash

### `origin_mismatch`  
- Add `http://localhost:3000` to Authorized JavaScript origins in Google Cloud Console

### OAuth popup blocked
- Allow popups for localhost:3000 in browser settings
- Or test in incognito mode

### Session not persisting
- Check Supabase Site URL is set to `http://localhost:3000`
- Verify callback route is working at `/auth/callback` 