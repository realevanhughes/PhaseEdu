# EduCore
## Introduction
This was a project started by Evan Hughes (realevanhughes), Thomas Charleston, Ethan Pearson and Simon Gazdag for a HPE hackathon.
It is intended to be a replacement for expensive and poorly designed student management systems.
It will allow teachers and administrators to assign homework, show timetables, give reward points and more.
Multi organisation support was built in from the beginning which makes it ideal for schools of any size (or even entire groups of schools).

## Features
- Markdown support for homework setting
- Fully featured API for future upgrades
- Excellent administration tools for keeping track of student and teacher accounts
- Customizable frontend web interface
- Student register for attendance
- Calendar for lesson planning and event organising
- Individual student timetables that can be exported
- Document previewing for convenient homework
- Behaviour management with points system (categories for points can be made per org)
- Notes section (also with markdown support)
- Versatile class system for student organisation

## How it's built
We have chosen to use a NodeJS based webserver built on top of a MySQL database for the backend.
This is paired with a React frontend interface that communicates with NodeJS with sessions.

MySQL DB => NodeJS => React/webpage

This makes it super easy to set up as you just need two applications running.

## Install
### SQL server
This project does NOT cover the install and maintenance of the mySQL server needed to run the backend.
Please feel free to choose any solution you like (local or exposed) using something like docker or bare metal.
The default stock database can be found in this repo and should simply be imported into your mySQL instance.
It is imperative that you make at least one user with most SQL permissions (except drop or user management ones) where you know the username and password.
It is advisable that you implement ssl encryption if it is exposed to the internet.



Please ensure the following npm packages are installed:
- express
- bcrypt
- body-parser
- mysql2
- fs
- dotenv

You can install these by running:
```bash
$ npm install express bcrypt body-parser mysql2 fs dotenv winston
```

Clone this repo using:
```bash
$ git clone https://github.com/realevanhughes/EduCore
```

Ensure the .env file contains your specific mySQL credentials and configuration.

Next, simply run the NodeJS application using express via
Clone this repo using:
```bash
$ npm run educore
```

Note:
> There is NO default user so you will need to add a row in your SQL database manually for initial config

# Configuration
The .env file located at the root directory contains all the usual (and supported) config options.
Changing things outside the .env file is not recommended.

The following table describes exactly what line changes what setting.

| Line               | Default    | Use                                                           |
|--------------------|------------|---------------------------------------------------------------|
| NODE_ENV           | prod       | Allows the changing of environment types                      |
| APP_SECRET         | default    | Secrete used for express JS (should be a random string)       |
| SESSION_COOKIE_KEY | default    | Key for cookie generation (should be a random string)         |
| BANNER             | banner.txt | Banner text file for initialisation                           |
|                    |            |                                                               |
| DB_HOST            | localhost  | The hostname for the database of choice                       |
| DB_PORT            | 25060      | The port for the database of choice                           |
| DB_USER            | douser     | The user that the server will interact with the database with |
| DB_PASSWORD        | password   | The password for the aforementioned user                      |
| DB_NAME            | defaultdb  | The database where the tables are located                     |
|                    |            |                                                               |
| HOST_PORT          | 3000       | The host port for the express JS server                       |

