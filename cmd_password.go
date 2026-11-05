package main

import (
	"bufio"
	"errors"
	"flag"
	"fmt"
	"os"
	"strings"

	"golang.org/x/crypto/bcrypt"
	"golang.org/x/term"
)

// setPasswordCmd: `kcet set-password -db PATH NAME`. Sets a new password for any account from the
// server's shell. There is no web endpoint for this, so it can't be attacked over the internet.
// The new password is typed twice without echo, or read as one line from stdin when piped.
// It bumps the account's session generation, so every device logged in to it is signed out.
func setPasswordCmd(args []string) int {
	fs := flag.NewFlagSet("set-password", flag.ContinueOnError)
	dbPath := fs.String("db", "kcet.db", "SQLite database path")
	fs.Usage = func() {
		fmt.Fprintln(os.Stderr, "usage: kcet set-password -db /opt/kcet/data/kcet.db NAME")
		fmt.Fprintln(os.Stderr, "Run it as the service user, e.g.: runuser -u deploy -- /opt/kcet/kcet set-password -db /opt/kcet/data/kcet.db NAME")
	}
	if err := fs.Parse(args); err != nil {
		return 2
	}
	if fs.NArg() != 1 {
		fs.Usage()
		return 2
	}
	name := strings.TrimSpace(fs.Arg(0))

	// SQLite may create its -wal/-shm files as whoever opens the database. Files owned by root would
	// stop the service (running as its own user) from writing, so refuse to run as root.
	if os.Geteuid() == 0 {
		fmt.Fprintln(os.Stderr, "set-password: don't run this as root; it could leave database files the service can't write.")
		fmt.Fprintln(os.Stderr, "Run: runuser -u deploy -- "+os.Args[0]+" set-password -db "+*dbPath+" "+name)
		return 1
	}
	if _, err := os.Stat(*dbPath); err != nil {
		fmt.Fprintf(os.Stderr, "set-password: database %s: %v\n", *dbPath, err)
		return 1
	}

	store, err := OpenStore(*dbPath)
	if err != nil {
		fmt.Fprintf(os.Stderr, "set-password: %v\n", err)
		return 1
	}
	acc, err := store.AccountByName(name)
	if errors.Is(err, errNotFound) {
		fmt.Fprintf(os.Stderr, "set-password: no account named %q\n", name)
		return 1
	}
	if err != nil {
		fmt.Fprintf(os.Stderr, "set-password: %v\n", err)
		return 1
	}

	pw, err := readNewPassword(acc.Name)
	if err != nil {
		fmt.Fprintf(os.Stderr, "set-password: %v\n", err)
		return 1
	}
	hash, err := bcrypt.GenerateFromPassword([]byte(pw), bcrypt.DefaultCost)
	if err != nil {
		fmt.Fprintf(os.Stderr, "set-password: %v\n", err)
		return 1
	}
	if _, err := store.SetPassword(acc.ID, string(hash)); err != nil {
		fmt.Fprintf(os.Stderr, "set-password: %v\n", err)
		return 1
	}
	fmt.Printf("Password for %s changed. Every device logged in to it is signed out.\n", acc.Name)
	return 0
}

func readNewPassword(name string) (string, error) {
	fd := int(os.Stdin.Fd())
	var pw string
	if term.IsTerminal(fd) {
		fmt.Fprintf(os.Stderr, "New password for %s: ", name)
		a, err := term.ReadPassword(fd)
		fmt.Fprintln(os.Stderr)
		if err != nil {
			return "", err
		}
		fmt.Fprint(os.Stderr, "Type it again: ")
		b, err := term.ReadPassword(fd)
		fmt.Fprintln(os.Stderr)
		if err != nil {
			return "", err
		}
		if string(a) != string(b) {
			return "", errors.New("the two passwords don't match")
		}
		pw = string(a)
	} else {
		line, err := bufio.NewReader(os.Stdin).ReadString('\n')
		if err != nil && line == "" {
			return "", errors.New("no password on stdin")
		}
		pw = strings.TrimRight(line, "\r\n")
	}
	if len(pw) < 6 || len(pw) > 72 {
		return "", errors.New("password should be 6 to 72 characters")
	}
	return pw, nil
}
