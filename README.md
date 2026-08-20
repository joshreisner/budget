# budget

This is a frontend to help enter expenses into a Google Sheet.

To use this, create a Google Sheet, and add the following columns:

- Date
- Description
- Category
- Amount
- Notes

Then go to the Google Cloud Console and enable the Google Sheets API, create a private key, and create a service account.

Then add your service account email as an Editor on your Google Sheet.

Then create an .env file with these constants:

```
APP_PASSWORD = "select-a-strong-password"

GOOGLE_PRIVATE_KEY = "-----BEGIN PRIVATE KEY-----\nyour-private-key-goes-here\n-----END PRIVATE KEY-----\n"
GOOGLE_SERVICE_ACCOUNT_EMAIL = "your-user@your-project.iam.gserviceaccount.com"
GOOGLE_SHEET_ID = "your-sheet-id"
```

then `npm run dev`, log in, and start entering transactions
