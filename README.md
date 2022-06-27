# 5mwt-js
5-meter walk test web application

The 5-meter walk test is a simple exercise test [^1] for measuring outcomes in surgery.


[^1]: [Society of Thoracic Surgeons Protocol for 5-Meter Walk Test](https://www.ncbi.nlm.nih.gov/pmc/articles/PMC3751713/#app-1title)

## Run

Prerequisites:
- install nodejs (latest LTS version)
- run `npm i` in the root folder of this project

### Run the app
Call `npm run start` will start a web server with the app served locally on port 3000.

### Run the data analysis
Run `node src/seeTest.mjs` to only plot the signals on a web interface.
Run `node src/processTest.mjs` to run the algorithm for a specific signal.

## Data marking
Run `node ./src/seeTest.mjs` to see the signals. Change the filename in the source of the script.

1. Fill in the file inside meta.txt with your details.

2. To manually the times when each phase of the test starts/end, in each folder inside `data/userX`, open the csv file (you can open it with Excel), start the data plotting script and identify the following:

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

3. Don't forget to commit + push your changes!

# Develop

- `src/stats.mjs` contains the implementation of simple statistics
- `src/playground.mjs` contains code where to test different ideas
- `src/processTest.mjs` is used to run the algorithm for a specific test


## Acknowledgments

- [Bahnuya CSS framework](https://hakanalpay.com/bahunya/)