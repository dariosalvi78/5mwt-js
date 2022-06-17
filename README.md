# 5mwt-js
5-meter walk test web application

## Run

Prerequisites:
- install nodejs
- run `npm i` in the root folder of this project

### Run the app
Call `npm run start` will start a web server with the app served locally on port 3000.

### Run the data analysis
Open the file under `src/processTest.mjs` and change the filename in the FILE variable (line 6). Run `node ./src/seeTest.mjs` to start the script.
The script will open a tab on your browser where you can see the charts related to the file you have selected.

## Data marking
Fill in the file inside meta.txt with your details.

To manually the times when each phase of the test starts/end, in each folder inside `data/userX`, open the csv file (you can open it with Excel), start the data plotting script and identify the following:

- filename: the filename you are analysing. You can rename it if you prefer.
- walkstart1: millisecond of when the first walking activity starts (check the acceleration module)
- walkend1: ms of when the first walking activity ends (exclude the two peaks around the tap of the button)
- turnstart1: ms of when the first turn around activity starts (check the rotation rate module and the orientation charts)
- turnend1: ms of when the first turn around activity ends
- walkstart2: ms of when the second walking activity starts
- walkend2: ms of when the second walking activity ends
- turnstart2: ms of when the second turn around activity starts
- turnend2: ms of when the second turn around activity ends
- walkstart3: ms of when the third walking activity starts
- walkend3: ms of when the third walking activity ends

Don't forget to commit + push your changes!


## Acknowledgments

- [Bahnuya CSS framework](https://hakanalpay.com/bahunya/)