UPchieve web server
===================

> Web server providing endpoints for the UPchieve web client

**Table of Contents**

- [Local Development](#local-development)
    - [Dependencies](#dependencies)
    - [Build Setup](#build-setup)
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

1. [`asdf`][asdf] for version management
2. Node.js 6.10.0

### Build Setup

1. If needed, ensure [`asdf`][asdf] and the [`asdf-nodejs`][asdf-nodejs] plugin
   are installed. (See their repos for installation instructions.)
2. If needed, install the appropriate version of Node.js:
   `asdf install nodejs 6.10.0`
3. Run `bin/setup` to set up database with test users and install dependencies.
   Run with `--verbose` to debug if needed.
4. Populate `config.js` with auth tokens (ask a teammate if you need
   any--improvements forthcoming).
5. Run `npm start` to start the dev server on `http://localhost:3000`.
6. See [the web client repo](https://github.com/UPchieve/web) for client
   installation

[asdf]: https://github.com/asdf-vm/asdf
[asdf-nodejs]: https://github.com/asdf-vm/asdf-nodejs

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

Makes a call to [CleanSpeak's Filter Content API][cleanspeak], analyzes the
API's response, and returns a boolean indicating whether or not the message is
clean.

[cleanspeak]: https://www.inversoft.com/docs/cleanspeak/3.x/tech/tutorials/filtering-content#using-the-filter-content-api

The response body looks like this if no error occurred:

```javascript
{
  "isClean": true // or false
}
```
