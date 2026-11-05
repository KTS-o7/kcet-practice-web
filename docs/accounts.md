# Accounts and passwords

Accounts are just a name and a password. There's no email, so there are no reset emails.

## Recovery codes

- **At sign-up:** every new account gets a 12-character recovery code (`XXXX-XXXX-XXXX`), shown once, with Copy and Download buttons. The student must tick "I've saved it" to continue.
- **Forgot password?** On the login page, the student enters their name, the code and a new password. The code works once: they get a fresh one straight away, and every other device is signed out.
- **Older accounts:** accounts made before recovery codes existed have none. They see a nudge on Home, and can make a code on the Account page (it needs their current password).
- **Lost the code too?** The login page tells them to email hi@shenthar.me (set in `web/src/lib/contact.ts`). Accounts have no email, so check it's really them before doing anything: ask for something only they'd know, like the date or score of a recent test from their Admin page. Then an admin opens the student's page in Admin → **Reset password**. That makes a new code to send them privately (reply to their email). Their old code stops working, but their password and progress are unchanged until they use the new one.
- **Storage:** codes are stored bcrypt-hashed, like passwords. Wrong codes count toward the same lockouts as wrong passwords.

## Changing your own password

Account menu → **Account and password**. It asks for the current password, and signs out every other device logged in to the account.

## Resetting any password from the server

If someone, including an admin, can't log in, reset their password from the server's shell. There's no web page for this, so it can't be attacked over the internet.

```sh
ssh <server>
runuser -u deploy -- /opt/kcet/kcet set-password -db /opt/kcet/data/kcet.db NAME
```

It asks for the new password twice, without showing it. To script it, pipe the password in as one line:

```sh
printf '%s\n' 'the new password' | runuser -u deploy -- /opt/kcet/kcet set-password -db /opt/kcet/data/kcet.db NAME
```

- **Run it as the service user** (`deploy`), not root. Opening the database as root can leave SQLite files the service can't write, so the command refuses to run as root.
- **It's safe while the site is running.** SQLite handles the concurrent write.
- **It signs out every device** logged in to that account.
- **The name isn't case-sensitive.**

## Lockouts

- **Per account:** 10 wrong passwords for one account within an hour lock that account for 15 minutes after the last wrong try, whatever the attempts' internet address.
- **Per address:** there's a separate limit of 8 failures per address per 15 minutes.
- **Restarts:** both are kept in memory, so restarting the service (`systemctl restart kcet`) clears them.
