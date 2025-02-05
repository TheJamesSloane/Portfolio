document.addEventListener('DOMContentLoaded', function () {
    // Initially indicate that the user has not selected a briefcase
    let userBriefcase = false;

    // Attach event listener to the START button
    document.querySelector('#view-main-menu-button').addEventListener('click', function () {
        document.querySelector('#view-start').style.display = 'none';
        document.querySelector('#view-main-menu').style.display = 'block';
        document.querySelector('#body-deal').style.display = 'none';
    });


    // Attach event listener to the SCORES button
    document.getElementById('view-scores-button').addEventListener('click', function () {
        document.getElementById('scores-modal').style.display = 'flex';
    });

    // Close the SCORES modal
    document.getElementById('close-scores').addEventListener('click', function () {
        document.getElementById('scores-modal').style.display = 'none';
    });


    // Attach event listener to the PLAY button
    document.querySelector('#play-button').addEventListener('click', function () {
        document.querySelector('#body-deal').style.display = 'block';
        document.querySelector('#body-main-menu').style.display = 'none';

        // Game data and dollar values
        const dollarValues = [
            0.01, 1, 5, 10, 25, 50, 75, 100, 200, 300, 400, 500, 750, 1000, 5000, 10000, 25000, 50000, 75000, 100000, 200000, 300000, 400000, 500000, 750000, 1000000
        ];

        function shuffle(array) {
            for (let i = array.length - 1; i > 0; i--) {
                const j = Math.floor(Math.random() * (i + 1));
                [array[i], array[j]] = [array[j], array[i]];
            }
        }

        // Store all relevant game state data in a model
        const gameData = {
            isOngoingGame: false,
            userBriefcase: null,
            is_active_1: true, is_active_2: true, is_active_3: true, is_active_4: true,
            is_active_5: true, is_active_6: true, is_active_7: true, is_active_8: true,
            is_active_9: true, is_active_10: true, is_active_11: true, is_active_12: true,
            is_active_13: true, is_active_14: true, is_active_15: true, is_active_16: true,
            is_active_17: true, is_active_18: true, is_active_19: true, is_active_20: true,
            is_active_21: true, is_active_22: true, is_active_23: true, is_active_24: true,
            is_active_25: true, is_active_26: true
        };

        // Set up the game
        let openedBriefcasesCount = 0;
        const openedBriefcaseCountMilestones = [6, 11, 15, 18, 20, 21, 22, 23, 24];
        let briefcasesToOpen = 0;
        let remainingDollarValues = [...dollarValues];
        let selectedBriefcase = null;
        let madeCounteroffer = false;
        let latestBankerOfferAmount = 0;
        let latestExpectedValue = 0;
        let userBriefcaseNumber = 0;

        function setupGame() {
            // Shuffles the dollar values before assigning them
            shuffle(dollarValues);

            // Assign randomised values to the briefcases
            for (let i = 1; i <= 26; i++) {
                gameData[`briefcase_${i}`] = dollarValues[i - 1];
            }

            // Mark game as ongoing
            gameData.isOngoingGame = true;

            // Attach click event listeners to each briefcase
            for (let i = 1; i <= 26; i++) {
                const briefcase = document.getElementById(`briefcase-${i}`);
                if (briefcase) {
                    briefcase.addEventListener('click', function () {
                        if (!userBriefcase) {

                            // The user selects their briefcase
                            gameData.userBriefcase = i;
                            userBriefcaseNumber = i;
                            // Make the selected briefcase inactive
                            gameData[`is_active_${i}`] = false;
                            userBriefcase = true;

                            // Indicate which briefcases the user has selected
                            document.getElementById('selected-briefcase-number').textContent = i;
                            document.getElementById('briefcase-selection-modal').style.display = 'block';

                            // Change the colour of the briefcase to gold and prevent further clicks on this briefcase
                            this.style.backgroundColor = 'gold';
                            this.style.pointerEvents = 'none';
                            selectedBriefcase = this;

                            // Indicate to the user how many briefcases they are to open (this process continues further down)
                            briefcasesToOpen = calculateBriefcasesToOpen(openedBriefcasesCount);
                            document.getElementById('number-to-open').textContent = briefcasesToOpen;
                            document.querySelector('#select-your-briefcase').style.display = 'none';
                            document.querySelector('#select-a-briefcase').style.display = 'block';

                        } else {

                            // Reveal what is contained in each subsequent briefcase
                            gameData[`is_active_${i}`] = false;
                            const number = gameData[`briefcase_${i}`];
                            const formattedNumber = `$${number.toLocaleString()}`;
                            document.getElementById('briefcase-contents').textContent = formattedNumber;
                            document.getElementById('briefcase-contents-modal').style.display = 'block';

                            // Change the colour of the briefcase to grey and prevent further clicks on this briefcase
                            this.style.backgroundColor = 'gray';
                            this.style.pointerEvents = 'none';

                            document.getElementById('close-briefcase-modal').addEventListener('click', function () {
                                document.getElementById('briefcase-contents-modal').style.display = 'none';
                            });

                            const briefcaseAmount = gameData[`briefcase_${i}`];
                            const dollarCells = document.querySelectorAll('.dollar-cell');
                            dollarCells.forEach(cell => {
                                const cellAmount = parseFloat(cell.getAttribute('data-amount'));
                                if (cellAmount === briefcaseAmount) {
                                    cell.classList.add('faded');
                                }
                            });

                            openedBriefcasesCount += 1;
                            remainingDollarValues = remainingDollarValues.filter(amount => amount !== briefcaseAmount);

                            // Indicate to the user how many briefcases they are to open
                            briefcasesToOpen = calculateBriefcasesToOpen(openedBriefcasesCount);
                            if (briefcasesToOpen > 1 && openedBriefcasesCount < 24) {
                                document.getElementById('number-to-open').textContent = briefcasesToOpen;
                                document.querySelector('#select-your-briefcase').style.display = 'none';
                                document.querySelector('#select-one-briefcase').style.display = 'none';
                                document.querySelector('#select-a-briefcase').style.display = 'block';
                            } else if (openedBriefcasesCount == 24) {
                                document.querySelector('#select-your-briefcase').style.display = 'none';
                                document.querySelector('#select-one-briefcase').style.display = 'none';
                                document.querySelector('#select-a-briefcase').style.display = 'none';
                                document.querySelector('#select-final-briefcase').style.display = 'block';
                                selectedBriefcase.style.pointerEvents = 'auto';
                            } else if (openedBriefcasesCount == 25) {
                                document.querySelector('#select-final-briefcase').style.display = 'none';
                                document.querySelector('#game-over').style.display = 'block';
                            } else if (openedBriefcasesCount < 24) {
                                document.querySelector('#select-your-briefcase').style.display = 'none';
                                document.querySelector('#select-one-briefcase').style.display = 'block';
                                document.querySelector('#select-a-briefcase').style.display = 'none';
                            }

                            let bankerOfferMade = false;

                            document.getElementById('close-briefcase-modal').addEventListener('click', function () {

                                if (openedBriefcasesCount == 25) {
                                    const finalBriefcaseDollarValue = `$${number.toLocaleString()}`;
                                    document.getElementById('winnings-final').textContent = finalBriefcaseDollarValue;
                                    document.getElementById('banker-offer-modal').style.display = 'none';
                                    document.getElementById('name-input-section').style.display = 'block';
                                    userBriefcaseContents = gameData[`briefcase_${userBriefcaseNumber}`];
                                    const formattedNumber = `$${userBriefcaseContents.toLocaleString()}`;
                                    document.getElementById('user-briefcase-contents').textContent = formattedNumber;
                                    document.getElementById('winnings').value = number;
                                }


                                // The banker should make an offer when a milestone is reached
                                if (openedBriefcaseCountMilestones.includes(openedBriefcasesCount) && !bankerOfferMade) {
                                    bankerOffer();
                                    bankerOfferMade = true;
                                }

                            });
                        }
                    });
                }
            }
        }

        function calculateBriefcasesToOpen(openedBriefcasesCount) {
            if (openedBriefcasesCount == 5 || openedBriefcasesCount == 10 || openedBriefcasesCount == 14 || openedBriefcasesCount == 17 || openedBriefcasesCount == 19 || openedBriefcasesCount == 20 || openedBriefcasesCount == 21 || openedBriefcasesCount == 22 || openedBriefcasesCount == 23) {
                return 1;
            }
            if (openedBriefcasesCount == 4 || openedBriefcasesCount == 9 || openedBriefcasesCount == 13 || openedBriefcasesCount == 16 || openedBriefcasesCount == 18) {
                return 2;
            }
            if (openedBriefcasesCount == 3 || openedBriefcasesCount == 8 || openedBriefcasesCount == 12 || openedBriefcasesCount == 15) {
                return 3;
            }
            if (openedBriefcasesCount == 2 || openedBriefcasesCount == 7 || openedBriefcasesCount == 11) {
                return 4;
            }
            if (openedBriefcasesCount == 1 || openedBriefcasesCount == 6) {
                return 5;
            }
            if (openedBriefcasesCount == 0) {
                return 6;
            }
        }


        function bankerOffer() {

            // Calculate the banker's offer
            const probabilityOfSelection = 1 / (26 - openedBriefcasesCount);
            const expectedValue = remainingDollarValues.reduce((sum, value) => sum + (value * probabilityOfSelection));
            const multiplier = 0.9;
            const bankerOfferAmount = Math.round(expectedValue * multiplier);

            // Display the offer from the banker
            const formattedOffer = `$${bankerOfferAmount.toLocaleString()}`;
            latestBankerOfferAmount = bankerOfferAmount;
            latestExpectedValue = expectedValue;
            document.getElementById('banker-offer-amount').textContent = formattedOffer;
            document.getElementById('banker-offer-amount-counteroffer').textContent = formattedOffer;
            if (madeCounteroffer) {
                document.getElementById('banker-offer-modal').style.display = 'block';

                // Accept the offer and show the name input section
                document.getElementById('accept-offer').addEventListener('click', function () {
                    document.getElementById('winnings-final').textContent = formattedOffer;
                    document.getElementById('banker-offer-modal').style.display = 'none';
                    document.getElementById('name-input-section').style.display = 'block';
                    userBriefcaseContents = gameData[`briefcase_${userBriefcaseNumber}`];
                    const formattedNumber = `$${userBriefcaseContents.toLocaleString()}`;
                    document.getElementById('user-briefcase-contents').textContent = formattedNumber;
                    document.getElementById('winnings').value = bankerOfferAmount;
                });

                // Continue playing
                document.getElementById('continue-playing').addEventListener('click', function () {
                    document.getElementById('banker-offer-modal').style.display = 'none';
                });
            } else {
                document.getElementById('banker-offer-modal-counteroffer').style.display = 'block';

                // Accept the offer and show the name input section
                document.getElementById('accept-offer-counteroffer').addEventListener('click', function () {
                    document.getElementById('winnings-final').textContent = formattedOffer;
                    document.getElementById('banker-offer-modal-counteroffer').style.display = 'none';
                    document.getElementById('name-input-section').style.display = 'block';
                    userBriefcaseContents = gameData[`briefcase_${userBriefcaseNumber}`];
                    const formattedNumber = `$${userBriefcaseContents.toLocaleString()}`;
                    document.getElementById('user-briefcase-contents').textContent = formattedNumber;
                    document.getElementById('winnings').value = bankerOfferAmount;
                });

                // Make a counteroffer
                document.getElementById('make-counteroffer').addEventListener('click', function () {
                    document.getElementById('banker-offer-modal-counteroffer').style.display = 'none';
                    document.getElementById('counteroffer-container').style.display = 'block';

                    // Add input formatting for the counteroffer field
                    const input = document.getElementById('user-counteroffer');

                    input.addEventListener('input', function () {
                        // Remove all non-digit characters
                        const rawValue = input.value.replace(/[^\d]/g, '');

                        // Format the number with commas and add the dollar sign
                        const formattedValue = rawValue
                            ? '$' + parseInt(rawValue, 10).toLocaleString('en-US')
                            : '';

                        // Update the input value with the formatted value
                        input.value = formattedValue;
                    });
                });

                // Submit the counteroffer
                document.getElementById('submit-counteroffer').addEventListener('click', function (e) {
                    madeCounteroffer = true;
                    const userCounteroffer = parseInt(document.getElementById('user-counteroffer').value.replace(/[^\d]/g, ''));

                    // Validate the counteroffer
                    if (isNaN(userCounteroffer)) {
                        e.stopImmediatePropagation();
                        alert('Please enter a dollar figure.');
                        return;
                    }

                    if (userCounteroffer < latestBankerOfferAmount) {
                        e.stopImmediatePropagation();
                        alert(`Your counteroffer must be at least $${(latestBankerOfferAmount + 1).toLocaleString()}.`);
                        return;
                    }

                    // Determine whether the computer accepts the counteroffer
                    if (userCounteroffer < latestExpectedValue) {
                        document.getElementById('counteroffer-container').style.display = 'none';
                        document.getElementById('counteroffer-accepted').style.display = 'block';
                        document.getElementById('close-counteroffer-accepted').addEventListener('click', function () {
                            document.getElementById('counteroffer-accepted').style.display = 'none';
                            document.getElementById('winnings-final').textContent = `$${userCounteroffer.toLocaleString()}`;
                            document.getElementById('name-input-section').style.display = 'block';
                            userBriefcaseContents = gameData[`briefcase_${userBriefcaseNumber}`];
                            const formattedNumber = `$${userBriefcaseContents.toLocaleString()}`;
                            document.getElementById('user-briefcase-contents').textContent = formattedNumber;
                            document.getElementById('winnings').value = userCounteroffer;
                        });
                    } else {
                        document.getElementById('counteroffer-container').style.display = 'none';
                        document.getElementById('counteroffer-rejected').style.display = 'block';
                    }
                });

                // Close counteroffer rejected modal
                document.getElementById('close-counteroffer-rejected').addEventListener('click', function () {
                    document.getElementById('counteroffer-rejected').style.display = 'none';
                });

                // Continue playing
                document.getElementById('continue-playing-counteroffer').addEventListener('click', function () {
                    document.getElementById('banker-offer-modal-counteroffer').style.display = 'none';
                });
            }
        }

        setupGame();

        // Close the briefcase selection modal
        document.getElementById('close-briefcase-selection-modal').addEventListener('click', function () {
            document.getElementById('briefcase-selection-modal').style.display = 'none';
        });
    });
});
