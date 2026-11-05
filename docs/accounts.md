# Accounts and passwords

Accounts are just a name and a password. There's no email, so there are no reset emails.

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
