UPchieve web server
===================

> Web server providing endpoints for the UPchieve web client

[![CircleCI](https://circleci.com/gh/UPchieve/server.svg?style=svg)](https://circleci.com/gh/UPchieve/server)

**Table of Contents**

- [Local Development](#local-development)
    - [Dependencies](#dependencies)
    - [Setup](#setup)
    - [Test Users](#test-users)
- [Structure](#structure)
    - [config.js](#configjs)
    - [models](#models)
    - [router](#router)
    - [controllers](#controllers)
    - [services](#services)
- [Endpoints](#endpoints)
    - [POST /auth/login](#post-authlogin)
    - [GET /auth/logout](#get-authlogout)
    - [POST /auth/register/checkcred](#post-authregistercheckcred)
    - [POST /auth/register](#post-authregister)
    - [POST /auth/reset/send](#post-authresetsend)
    - [POST /auth/reset/confirm](#post-authresetconfirm)
    - [POST /api/session/new](#post-apisessionnew)
    - [POST /api/session/check](#post-apisessioncheck)
    - [POST /api/training/questions](#post-apitrainingquestions)
    - [POST /api/training/score](#post-apitrainingscore)
    - [POST /api/calendar/init](#post-apicalendarinit)
    - [POST /api/calendar/get](#post-apicalendarget)
    - [POST /api/calendar/save](#post-apicalendarsave)
    - [POST /api/feedback](#post-apifeedback)
    - [GET /api/user](#get-apiuser)
    - [PUT /api/user](#put-apiuser)
    - [GET /api/user/:id](#get-apiuserid)
    - [POST /api/verify/send](#post-apiverifysend)
    - [POST /api/verify/confirm](#post-apiverifyconfirm)
    - [POST /moderate/message](#post-moderatemessage)


Local Development
-----------------

### Dependencies

The recommended tool for runtime version managment is [`asdf`][asdf]. To use `asdf` on Windows, first install the appropriate Linux shell distribution using [`WSL`][wsl] (Windows Subsystem for Linux).

Install the following asdf plugins:

1. Node.js (see version listed in `.tool-versions`)
2. MongoDB (see version listed in `.tool-versions`)

- [`asdf-nodejs`][asdf-nodejs]

```shell-script
asdf plugin-add nodejs https://github.com/asdf-vm/asdf-nodejs.git
bash ~/.asdf/plugins/nodejs/bin/import-release-team-keyring
asdf install nodejs [VERSION]
```

- [`asdf-mongodb`][asdf-mongodb]

```shell-script
asdf plugin-add mongodb https://github.com/UPchieve/asdf-mongodb
asdf install mongodb [VERSION]
```

[wsl]: https://docs.microsoft.com/en-us/windows/wsl/install-win10
[asdf]: https://github.com/asdf-vm/asdf
[asdf-nodejs]: https://github.com/asdf-vm/asdf-nodejs
[asdf-mongodb]: https://github.com/UPchieve/asdf-mongodb

### Setup

1. Start a local MongoDB server by running `mongod`. In a separate terminal, you can try connecting to the database by running `mongo` (`mongod` to start the database vs. `mongo` to connect via command line!). Run `quit()` to exit the shell. You can also interface with the database using a free MongoDB GUI such as [MongoDB Compass Community](https://docs.mongodb.com/manual/administration/install-community/)
2. Run `bin/setup` to set up the database with test users and install dependencies.
   Run with `--verbose` to debug if needed.
3. Populate `config.js` with auth tokens (ask a teammate if you need
   any of these--improvements forthcoming).
4. Run `npm run dev` to start the dev server on `http://localhost:3000`. If you get a [`bcrypt`][bcrypt] compilement error, run `npm rebuild`.
5. See [the web client repo](https://github.com/UPchieve/web) for client
   installation

[bcrypt]: https://www.npmjs.com/package/bcrypt

### Test Users

The database is populated with the following users for local development:

| email                     | password      |
|:--------------------------|:--------------|
| `student1@upchieve.org`   | `Password123` |
| `volunteer1@upchieve.org` | `Password123` |
| `volunteer2@upchieve.org` | `Password123` |

Structure
---------

The root folder of the repository provides the bootstrap file `main.js` and a
package definitions file.

### config.js

`config.js` contains a map of configuration keys for running the server. All
keys and sensitive information should be placed in this file.

### models

Model definitions that map to database models, along with related methods to act
on those models, such as parsing, validation, and data transformations.

### router

Directory structure mimics the endpoint structure exposed by the server. Each
file provides one or more endpoint routes, responsible for request
acceptance/rejection and error handling.

### controllers

Routes use controllers to perform the business logic of the server, providing
separation of concerns: the controllers have no need to be aware of how the
endpoints work. Instead, a controller provides ways to allow the routes to
trigger something (a user update, e.g.)

### services

A service is a step higher than a controller. Services provide abstract
functions to one or many controllers, often to interface with third party
services.

Endpoints
---------

### POST /auth/login

Expects the following request body:

```json
{
  "email": "String",
  "password": "String"
}
```

Authenticates the user with a session if credentials are correct.

### GET /auth/logout

Removes the user's current session.

### POST /auth/register/checkcred

Check whether the credential user entered is valid. (first step of registeration)
The server will check is there any duplications for email and validate the password.

```json
{
  "email": "String",
  "password": "String"
}
```

Possible errors:

- Email/password not provided
- Password does not meet requirements
- Email is not valid
- Email already exists

### POST /auth/register

Create a new account based on the information posted.

```json
{
  "email": "String",
  "password": "String",
  "code": "String",
  "highSchool": "String",
  "firstName": "String",
  "lastName": "String"
}
```

Possible errors:

- Email/password not provided
- Password does not meet requirements
- Email is not valid
- Email already exists
- Could not hash password
- Could not send verification email (for volunteers)

### POST /auth/reset/send

```json
{
  "email": "String"
}
```

### POST /auth/reset/confirm

```json
{
  "email": "String",
  "password": "String",
  "newpassword": "String",
  "token": "String"
}
```

### POST /api/session/new

```json
{
  "sessionType": "String",
  "sessionSubTopic": "String"
}
```

### POST /api/session/check

```json
{
  "sessionId": "String"
}
```

### POST /api/training/questions

```json
{
  "category": "String"
}
```

### POST /api/training/score

```json
{
  "userid": "String",
  "idAnswerMap": "String",
  "category": "String"
}
```

### POST /api/calendar/init

```json
{
  "userid": "String"
}
```

### POST /api/calendar/get

```json
{
  "userid": "String"
}
```

### POST /api/calendar/save

```json
{
  "userid": "String",
  "availability": "String"
}
```

### POST /api/feedback

```json
{
  "sessionId": "String",
  "responseData": "String"
}
```

### GET /api/user

Returns a sanitized public user record for the currently authenticated user

### PUT /api/user

Accepts a request body with fields mapping to profile fields to update for the
currently authenticated user:

```json
{
  "picture": "String"
}
```

### GET /api/user/:id

Returns a sanitized public user record for a user with the given id. May perform
checks on the authorization level of the current user to strip out priveliged
information.

### POST /api/verify/send

Sends an email to verify the current user with unique hash. The email provided
will overwrite the user record's email, in the event that the two do not match.

```json
{
  "email": "String"
}
```

### POST /api/verify/confirm

Accepts a token used to verify the current user.

```json
{
  "token": "String"
}
```

### POST /moderate/message

Expects the following request body:

```json
{
  "content": "string with the content of a message"
}
```

Returns a boolean indicating whether or not the message is
clean.

The response body looks like this if no error occurred:

```javascript
{
  "isClean": true // or false
}
```
