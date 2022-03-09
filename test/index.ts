import { expect } from "chai";
import { BigNumber, utils } from "ethers";
import { ethers } from "hardhat";
import { describe } from "mocha";

import { Lupi__factory, FakeCaller__factory } from "../typechain-types/index";

console.log(`index.ts`);
function getSalt(salt: string) {
  return utils.solidityKeccak256(["string"], [salt]);
}
const salt = getSalt("42");

function getGuessHash(currentNonce: string, guess: number, salt: string) {
  return utils.solidityKeccak256(
    ["bytes32", "uint32", "bytes32"],
    [currentNonce, guess, salt]
  );
}

const nullAddress = "0x0000000000000000000000000000000000000000";

const enum GamePhase {
  GUESS,
  REVEAL,
  ENDGAME,
}

describe("Lupi", async function () {
  it("Should return return game version after deployment", async function () {
    const Lupi = (await ethers.getContractFactory("Lupi")) as Lupi__factory;
    const lupi = await Lupi.deploy();
    await lupi.deployed();

    const blockNum = await ethers.provider.getBlockNumber();
    const blockAfter = await ethers.provider.getBlock(blockNum);
    const blockTimestamp = blockAfter.timestamp;

    expect(await lupi.getPhase()).to.equal(GamePhase.GUESS);
    expect((await lupi.getPhaseDeadline()).toNumber()).to.closeTo(
      blockTimestamp + 2 * 60,
      100
    );

    expect(await lupi.getRound()).to.equal(1);
  });

  it("Should commit 5 guesses", async function () {
    const Lupi = (await ethers.getContractFactory("Lupi")) as Lupi__factory;
    const lupi = await Lupi.deploy();
    await lupi.deployed();

    const [_owner, addr1, addr2] = await ethers.getSigners();
    const users = [addr1, addr2];

    const lupiAddr1 = lupi.connect(addr1);

    const currentNonce = await lupiAddr1.getCurrentNonce();

    for (let i = 1; i < 5; i++) {
      const guessHash = getGuessHash(currentNonce, i, salt);

      const overrides = {
        value: ethers.utils.parseEther("0.01"),
      };

      await lupiAddr1.commitGuess(guessHash, overrides);
    }
  });

  it("Should revert after guessDeadline passes", async function () {
    const Lupi = (await ethers.getContractFactory("Lupi")) as Lupi__factory;
    const lupi = await Lupi.deploy();
    await lupi.deployed();
    const [owner, addr1, addr2] = await ethers.getSigners();
    const users = [addr1, addr2];

    const lupiAddr1 = lupi.connect(addr1);

    const currentNonce = await lupiAddr1.getCurrentNonce();

    const guessHash = getGuessHash(currentNonce, 1, salt);

    const now =
      (await ethers.provider.getBlock(await ethers.provider.getBlockNumber()))
        .timestamp +
      3 * 60;
    await ethers.provider.send("evm_setNextBlockTimestamp", [now]);
    await ethers.provider.send("evm_mine", []);

    const overrides = {
      value: ethers.utils.parseEther("0.01"),
    };

    await expect(
      lupiAddr1.commitGuess(guessHash, overrides)
    ).to.be.revertedWith("Guess deadline has passed");
  });

  it("Should revert if no guess made", async function () {
    const Lupi = (await ethers.getContractFactory("Lupi")) as Lupi__factory;
    const lupi = await Lupi.deploy();
    await lupi.deployed();

    const [owner, addr1, addr2] = await ethers.getSigners();
    const users = [addr1, addr2];

    const lupiAddr1 = lupi.connect(addr1);

    const currentNonce = await lupiAddr1.getCurrentNonce();
    const round = await lupiAddr1.getRound();

    const guessHash = getGuessHash(currentNonce, 1, salt);

    const now =
      (await ethers.provider.getBlock(await ethers.provider.getBlockNumber()))
        .timestamp +
      3 * 60;
    await ethers.provider.send("evm_setNextBlockTimestamp", [now]);
    await ethers.provider.send("evm_mine", []);

    await expect(
      lupiAddr1.revealGuesses([{ round, guessHash, answer: 1, salt }])
    ).to.be.revertedWith("No guesses to reveal");
  });

  it("Should revert if reveal is for wrong round", async function () {
    const Lupi = (await ethers.getContractFactory("Lupi")) as Lupi__factory;
    const lupi = await Lupi.deploy();
    await lupi.deployed();
    const [owner, addr1, addr2] = await ethers.getSigners();
    const users = [addr1, addr2];

    const lupiAddr1 = lupi.connect(addr1);

    const currentNonce = await lupiAddr1.getCurrentNonce();
    const round = await lupiAddr1.getRound();

    const guessHash = getGuessHash(currentNonce, 1, salt);

    const overrides = {
      value: ethers.utils.parseEther("0.01"),
    };

    await lupiAddr1.commitGuess(guessHash, overrides);

    const now =
      (await ethers.provider.getBlock(await ethers.provider.getBlockNumber()))
        .timestamp +
      3 * 60;
    await ethers.provider.send("evm_setNextBlockTimestamp", [now]);
    await ethers.provider.send("evm_mine", []);

    await expect(
      lupiAddr1.revealGuesses([
        { round: round + 1, guessHash, answer: 2, salt },
      ])
    ).to.be.revertedWith("revealGuesses must be for current round");
  });

  it("Should revert if no matching guessHash found", async function () {
    const Lupi = (await ethers.getContractFactory("Lupi")) as Lupi__factory;
    const lupi = await Lupi.deploy();
    await lupi.deployed();
    const [owner, addr1, addr2] = await ethers.getSigners();
    const users = [addr1, addr2];

    const lupiAddr1 = lupi.connect(addr1);

    const currentNonce = await lupiAddr1.getCurrentNonce();
    const round = await lupiAddr1.getRound();

    const guessHash = getGuessHash(currentNonce, 1, salt);

    const overrides = {
      value: ethers.utils.parseEther("0.01"),
    };

    await lupiAddr1.commitGuess(guessHash, overrides);

    const now =
      (await ethers.provider.getBlock(await ethers.provider.getBlockNumber()))
        .timestamp +
      3 * 60;
    await ethers.provider.send("evm_setNextBlockTimestamp", [now]);
    await ethers.provider.send("evm_mine", []);

    const unguessedHash = getGuessHash(currentNonce, 2, salt);

    await expect(
      lupiAddr1.revealGuesses([
        { round, guessHash: unguessedHash, answer: 2, salt },
      ])
    ).to.be.revertedWith("revealGuesses no matching guessHash found");
  });

  it("Should revert if reveal too early", async function () {
    const Lupi = (await ethers.getContractFactory("Lupi")) as Lupi__factory;
    const lupi = await Lupi.deploy();
    await lupi.deployed();
    const [owner, addr1, addr2] = await ethers.getSigners();
    const users = [addr1, addr2];

    const lupiAddr1 = lupi.connect(addr1);

    const currentNonce = await lupiAddr1.getCurrentNonce();
    const round = await lupiAddr1.getRound();
    const guessHash = getGuessHash(currentNonce, 1, salt);

    const overrides = {
      value: ethers.utils.parseEther("0.01"),
    };

    await lupiAddr1.commitGuess(guessHash, overrides);

    await expect(
      lupiAddr1.revealGuesses([{ round, guessHash, answer: 1, salt }])
    ).to.be.revertedWith("revealGuesses guessDeadline hasn't passed");
  });

  it("Should revert if reveal too late", async function () {
    const Lupi = (await ethers.getContractFactory("Lupi")) as Lupi__factory;
    const lupi = await Lupi.deploy();
    await lupi.deployed();
    const [owner, addr1, addr2] = await ethers.getSigners();
    const users = [addr1, addr2];

    const lupiAddr1 = lupi.connect(addr1);

    const currentNonce = await lupiAddr1.getCurrentNonce();
    const round = await lupiAddr1.getRound();

    const guessHash = getGuessHash(currentNonce, 1, salt);

    const overrides = {
      value: ethers.utils.parseEther("0.01"),
    };

    await lupiAddr1.commitGuess(guessHash, overrides);

    const now =
      (await ethers.provider.getBlock(await ethers.provider.getBlockNumber()))
        .timestamp +
      5 * 60;
    await ethers.provider.send("evm_setNextBlockTimestamp", [now]);
    await ethers.provider.send("evm_mine", []);

    await expect(
      lupiAddr1.revealGuesses([{ round, guessHash, answer: 1, salt }])
    ).to.be.revertedWith("revealGuesses revealDeadline has passed");
  });

  it("Should revert if reveal is of <=0", async function () {
    const Lupi = (await ethers.getContractFactory("Lupi")) as Lupi__factory;
    const lupi = await Lupi.deploy();
    await lupi.deployed();

    const [owner, addr1, addr2] = await ethers.getSigners();
    const users = [addr1, addr2];

    const lupiAddr1 = lupi.connect(addr1);

    const currentNonce = await lupiAddr1.getCurrentNonce();
    const round = await lupiAddr1.getRound();

    const guessHash = getGuessHash(currentNonce, 0, salt);

    const overrides = {
      value: ethers.utils.parseEther("0.01"),
    };

    await lupiAddr1.commitGuess(guessHash, overrides);

    const now =
      (await ethers.provider.getBlock(await ethers.provider.getBlockNumber()))
        .timestamp +
      3 * 60;
    await ethers.provider.send("evm_setNextBlockTimestamp", [now]);
    await ethers.provider.send("evm_mine", []);

    await expect(
      lupiAddr1.revealGuesses([{ round, guessHash, answer: 0, salt }])
    ).to.be.revertedWith("revealGuesses answer must be positive");
  });

  it("Should revert if reveal hash doesn't match guess hash", async function () {
    const Lupi = (await ethers.getContractFactory("Lupi")) as Lupi__factory;
    const lupi = await Lupi.deploy();
    await lupi.deployed();
    const [owner, addr1, addr2] = await ethers.getSigners();
    const users = [addr1, addr2];

    const lupiAddr1 = lupi.connect(addr1);

    const currentNonce = await lupiAddr1.getCurrentNonce();
    const round = await lupiAddr1.getRound();

    const guessHash = getGuessHash(currentNonce, 1, salt);

    const overrides = {
      value: ethers.utils.parseEther("0.01"),
    };

    await lupiAddr1.commitGuess(guessHash, overrides);

    const now =
      (await ethers.provider.getBlock(await ethers.provider.getBlockNumber()))
        .timestamp +
      3 * 60;
    await ethers.provider.send("evm_setNextBlockTimestamp", [now]);
    await ethers.provider.send("evm_mine", []);

    const wrongSalt = getSalt("43");

    await expect(
      lupiAddr1.revealGuesses([
        { round, guessHash, answer: 1, salt: wrongSalt },
      ])
    ).to.be.revertedWith("Reveal hash does not match guessHash");
  });

  it("Should revert commitGuess after reveal has started", async function () {
    const Lupi = (await ethers.getContractFactory("Lupi")) as Lupi__factory;
    const lupi = await Lupi.deploy();
    await lupi.deployed();
    const [owner, addr1, addr2] = await ethers.getSigners();
    const users = [addr1, addr2];

    const lupiAddr1 = lupi.connect(addr1);

    const currentNonce = await lupiAddr1.getCurrentNonce();

    const guessHash = getGuessHash(currentNonce, 1, salt);

    const now =
      (await ethers.provider.getBlock(await ethers.provider.getBlockNumber()))
        .timestamp +
      5 * 60;
    await ethers.provider.send("evm_setNextBlockTimestamp", [now]);
    await ethers.provider.send("evm_mine", []);

    const overrides = {
      value: ethers.utils.parseEther("0.01"),
    };

    await expect(
      lupiAddr1.commitGuess(guessHash, overrides)
    ).to.be.revertedWith("Guess deadline has passed");
  });

  it("Should commit a guess and make a reveal", async function () {
    const Lupi = (await ethers.getContractFactory("Lupi")) as Lupi__factory;
    const lupi = await Lupi.deploy();
    await lupi.deployed();
    const currentNonce = await lupi.getCurrentNonce();
    const round = await lupi.getRound();

    const guessHash = getGuessHash(currentNonce, 1, salt);

    const overrides = {
      value: ethers.utils.parseEther("0.01"),
    };

    await lupi.commitGuess(guessHash, overrides);

    const players = await lupi.getPlayers();
    expect(players.length).to.equal(1);

    const committedGuessHashes = await lupi.getCommittedGuessHashes(players[0]);
    expect(committedGuessHashes.length).to.equal(1);

    const now =
      (await ethers.provider.getBlock(await ethers.provider.getBlockNumber()))
        .timestamp +
      3 * 60;
    await ethers.provider.send("evm_setNextBlockTimestamp", [now]);
    await ethers.provider.send("evm_mine", []);

    const revealHash = getGuessHash(currentNonce, 1, salt);

    await lupi.revealGuesses([
      { round, guessHash: revealHash, answer: 1, salt },
    ]);
  });

  it("Should commit 1, 1, and 2, reveal all, and 2 should win", async function () {
    const Lupi = (await ethers.getContractFactory("Lupi")) as Lupi__factory;
    const lupi = await Lupi.deploy();
    await lupi.deployed();
    const currentNonce = await lupi.getCurrentNonce();
    const round = await lupi.getRound();

    const guessHash1a = getGuessHash(currentNonce, 1, getSalt("a"));
    const guessHash1b = getGuessHash(currentNonce, 1, getSalt("b"));
    const guessHash2 = getGuessHash(currentNonce, 2, getSalt("2"));

    const overrides = {
      value: ethers.utils.parseEther("0.01"),
    };

    await lupi.commitGuess(guessHash1a, overrides);
    await lupi.commitGuess(guessHash1b, overrides);
    await lupi.commitGuess(guessHash2, overrides);

    const players = await lupi.getPlayers();
    expect(players.length).to.equal(1);

    const committedGuessHashes = await lupi.getCommittedGuessHashes(players[0]);
    expect(committedGuessHashes.length).to.equal(3);

    {
      const now =
        (await ethers.provider.getBlock(await ethers.provider.getBlockNumber()))
          .timestamp +
        3 * 60;
      await ethers.provider.send("evm_setNextBlockTimestamp", [now]);
      await ethers.provider.send("evm_mine", []);
    }

    await lupi.revealGuesses([
      { round, guessHash: guessHash1a, answer: 1, salt: getSalt("a") },
      { round, guessHash: guessHash1b, answer: 1, salt: getSalt("b") },
      { round, guessHash: guessHash2, answer: 2, salt: getSalt("2") },
    ]);
    {
      const now =
        (await ethers.provider.getBlock(await ethers.provider.getBlockNumber()))
          .timestamp +
        3 * 60;
      await ethers.provider.send("evm_setNextBlockTimestamp", [now]);
      await ethers.provider.send("evm_mine", []);
    }

    await expect(lupi.endGame())
      .to.emit(lupi, "GameResult")
      .withArgs(
        round,
        await lupi.signer.getAddress(),
        BigNumber.from("30000000000000000"),
        2
      );
  });

  it("Two users should commit 5 guesses and make 5 reveals, one user should also guess one unique (1)", async function () {
    const Lupi = (await ethers.getContractFactory("Lupi")) as Lupi__factory;
    const lupi = await Lupi.deploy();
    await lupi.deployed();
    const [owner, addr1, addr2] = await ethers.getSigners();
    const users = [addr1, addr2];

    const blockNum = await ethers.provider.getBlockNumber();
    const blockAfter = await ethers.provider.getBlock(blockNum);
    const blockTimestamp = blockAfter.timestamp;

    const currentNonce = await lupi.getCurrentNonce();
    const round = await lupi.getRound();

    expect(await lupi.getPhase()).to.equal(GamePhase.GUESS);

    for (let j = 0; j < 2; j++) {
      const lupiUser = lupi.connect(users[j]);

      for (let i = 2; i < 7; i++) {
        const guessHash = getGuessHash(currentNonce, i, salt);
        const overrides = {
          value: ethers.utils.parseEther("0.01"),
        };

        await lupiUser.commitGuess(guessHash, overrides);
      }
    }

    for (let j = 0; j < 2; j++) {
      const lupiUser = lupi.connect(users[j]);

      const committedGuessHashes = await lupiUser.getCommittedGuessHashes(
        users[j].address
      );
      expect(committedGuessHashes.length).to.equal(5);
    }

    const lupiUser = lupi.connect(users[0]);

    const guessHash = getGuessHash(currentNonce, 1, salt);

    const overrides = {
      value: ethers.utils.parseEther("0.01"),
    };

    await lupiUser.commitGuess(guessHash, overrides);

    const committedGuessHashes = await lupiUser.getCommittedGuessHashes(
      users[0].address
    );
    expect(committedGuessHashes.length).to.equal(6);

    const guessDeadline =
      (await ethers.provider.getBlock(await ethers.provider.getBlockNumber()))
        .timestamp +
      3 * 60;
    await ethers.provider.send("evm_setNextBlockTimestamp", [guessDeadline]);
    await ethers.provider.send("evm_mine", []);

    expect(await lupi.getPhase()).to.equal(GamePhase.REVEAL);
    expect((await lupi.getPhaseDeadline()).toNumber()).to.equal(
      blockTimestamp + 4 * 60
    );

    for (let j = 0; j < 2; j++) {
      const lupiUser = lupi.connect(users[j]);
      const reveals: {
        round: number;
        guessHash: string;
        answer: number;
        salt: string;
      }[] = [];
      for (let i = 2; i < 7; i++) {
        const guessHash = getGuessHash(currentNonce, i, salt);
        reveals.push({ round, guessHash, answer: i, salt });
      }
      await lupiUser.revealGuesses(reveals);
    }

    const revealHash = getGuessHash(currentNonce, 1, salt);

    await lupiUser.revealGuesses([
      { round, guessHash: revealHash, answer: 1, salt },
    ]);

    const revealedGuesses = await lupi.getRevealedGuess();
    expect(revealedGuesses.length).to.equal(11);

    const revealDeadline =
      (await ethers.provider.getBlock(await ethers.provider.getBlockNumber()))
        .timestamp +
      3 * 60;
    await ethers.provider.send("evm_setNextBlockTimestamp", [revealDeadline]);
    await ethers.provider.send("evm_mine", []);

    expect(await lupi.getPhase()).to.equal(GamePhase.ENDGAME);
    expect(await lupi.getPhaseDeadline()).to.equal(0);

    await expect(lupi.endGame())
      .to.emit(lupi, "GameResult")
      .withArgs(
        round,
        users[0].address,
        BigNumber.from("110000000000000000"),
        1
      );

    expect(await lupi.getPhase()).to.equal(GamePhase.GUESS);
    expect((await lupi.getPhaseDeadline()).toNumber()).to.closeTo(
      blockTimestamp + 7 * 60,
      100
    );
  });

  it("1 User should commit 9 guesses (4 duplicate, 1 unique) and make 5 reveals", async function () {
    const Lupi = (await ethers.getContractFactory("Lupi")) as Lupi__factory;
    const lupi = await Lupi.deploy();
    await lupi.deployed();
    const [owner, addr1, addr2] = await ethers.getSigners();
    const users = [addr1, addr2];

    const currentNonce = await lupi.getCurrentNonce();
    const round = await lupi.getRound();

    const lupiUser = lupi.connect(users[0]);

    for (let j = 0; j < 2; j++) {
      for (let i = 1; i < 5; i++) {
        const guessHash = getGuessHash(currentNonce, i, salt);
        const overrides = {
          value: ethers.utils.parseEther("0.01"),
        };

        await lupiUser.commitGuess(guessHash, overrides);
      }
    }

    const guessHash = getGuessHash(currentNonce, 6, salt);

    const overrides = {
      value: ethers.utils.parseEther("0.01"),
    };

    await lupiUser.commitGuess(guessHash, overrides);

    const guessDeadline =
      (await ethers.provider.getBlock(await ethers.provider.getBlockNumber()))
        .timestamp +
      3 * 60;
    await ethers.provider.send("evm_setNextBlockTimestamp", [guessDeadline]);
    await ethers.provider.send("evm_mine", []);

    for (let j = 0; j < 2; j++) {
      const lupiUser = lupi.connect(users[0]);
      for (let i = 1; i < 5; i++) {
        const guessHash = getGuessHash(currentNonce, i, salt);

        if (j === 0) {
          await lupiUser.revealGuesses([{ round, guessHash, answer: i, salt }]);
        } else {
          await expect(
            lupiUser.revealGuesses([{ round, guessHash, answer: i, salt }])
          ).to.be.revertedWith("Already revealed");
        }
      }
    }

    const revealHash = getGuessHash(currentNonce, 6, salt);

    const committedGuessHashes = await lupiUser.getCommittedGuessHashes(
      users[0].address
    );
    expect(committedGuessHashes.length).to.equal(9);

    await lupiUser.revealGuesses([
      { round, guessHash: revealHash, answer: 6, salt },
    ]);

    const revealedGuesses = await lupi.getRevealedGuess();
    expect(revealedGuesses.length).to.equal(9);
    const revealDeadline =
      (await ethers.provider.getBlock(await ethers.provider.getBlockNumber()))
        .timestamp +
      3 * 60;
    await ethers.provider.send("evm_setNextBlockTimestamp", [revealDeadline]);
    await ethers.provider.send("evm_mine", []);

    await expect(lupi.endGame())
      .to.emit(lupi, "GameResult")
      .withArgs(
        round,
        users[0].address,
        BigNumber.from("90000000000000000"),
        6
      );
  });

  it("Two users should make 4 idendtical gusses, there should be no winner", async function () {
    const Lupi = (await ethers.getContractFactory("Lupi")) as Lupi__factory;
    const lupi = await Lupi.deploy();
    await lupi.deployed();
    const [owner, addr1, addr2] = await ethers.getSigners();
    const users = [addr1, addr2];

    const currentNonce = await lupi.getCurrentNonce();
    const round = await lupi.getRound();

    for (let j = 0; j < 2; j++) {
      const lupiUser = lupi.connect(users[j]);

      for (let i = 1; i < 5; i++) {
        const guessHash = getGuessHash(currentNonce, i, salt);

        const overrides = {
          value: ethers.utils.parseEther("0.01"),
        };

        await lupiUser.commitGuess(guessHash, overrides);
      }
    }

    const guessDeadline =
      (await ethers.provider.getBlock(await ethers.provider.getBlockNumber()))
        .timestamp +
      3 * 60;
    await ethers.provider.send("evm_setNextBlockTimestamp", [guessDeadline]);
    await ethers.provider.send("evm_mine", []);

    for (let j = 0; j < 2; j++) {
      const lupiUser = lupi.connect(users[j]);
      for (let i = 1; i < 5; i++) {
        const guessHash = getGuessHash(currentNonce, i, salt);

        await lupiUser.revealGuesses([{ round, guessHash, answer: i, salt }]);
      }
    }

    const revealDeadline =
      (await ethers.provider.getBlock(await ethers.provider.getBlockNumber()))
        .timestamp +
      3 * 24 * 60 * 60;
    await ethers.provider.send("evm_setNextBlockTimestamp", [revealDeadline]);
    await ethers.provider.send("evm_mine", []);

    await expect(lupi.endGame())
      .to.emit(lupi, "GameResult")
      .withArgs(round, nullAddress, 0, 0);
  });

  it("Should should revert if endGame too early", async function () {
    const Lupi = (await ethers.getContractFactory("Lupi")) as Lupi__factory;
    const lupi = await Lupi.deploy();
    await lupi.deployed();
    const [_owner, addr1, addr2] = await ethers.getSigners();
    const users = [addr1, addr2];

    const currentNonce = await lupi.getCurrentNonce();
    const round = await lupi.getRound();

    for (let j = 0; j < 2; j++) {
      const lupiUser = lupi.connect(users[0]);

      for (let i = 1; i < 5; i++) {
        const guessHash = getGuessHash(currentNonce, i, salt);

        const overrides = {
          value: ethers.utils.parseEther("0.01"),
        };

        await lupiUser.commitGuess(guessHash, overrides);
      }
    }

    const lupiUser = lupi.connect(users[0]);

    const guessHash = getGuessHash(currentNonce, 6, salt);

    const overrides = {
      value: ethers.utils.parseEther("0.01"),
    };

    await lupiUser.commitGuess(guessHash, overrides);

    const guessDeadline =
      (await ethers.provider.getBlock(await ethers.provider.getBlockNumber()))
        .timestamp +
      3 * 60;
    await ethers.provider.send("evm_setNextBlockTimestamp", [guessDeadline]);
    await ethers.provider.send("evm_mine", []);

    for (let j = 0; j < 2; j++) {
      const lupiUser = lupi.connect(users[0]);
      for (let i = 1; i < 5; i++) {
        const guessHash = getGuessHash(currentNonce, i, salt);

        if (j === 0) {
          await lupiUser.revealGuesses([{ round, guessHash, answer: i, salt }]);
        } else {
          await expect(
            lupiUser.revealGuesses([{ round, guessHash, answer: i, salt }])
          ).to.be.revertedWith("Already revealed");
        }
      }
    }

    const revealHash = getGuessHash(currentNonce, 6, salt);

    await lupiUser.revealGuesses([
      { round, guessHash: revealHash, answer: 6, salt },
    ]);

    const revealedGuesses = await lupiUser.getRevealedGuess();

    expect(revealedGuesses.length).to.equal(9);

    await expect(lupi.endGame()).to.be.revertedWith("Still in reveal phase");
  });

  it("Should should revert commitGuess if not enough eth provided", async function () {
    const Lupi = (await ethers.getContractFactory("Lupi")) as Lupi__factory;
    const lupi = await Lupi.deploy();
    await lupi.deployed();
    const [owner, addr1, addr2] = await ethers.getSigners();

    const currentNonce = await lupi.getCurrentNonce();

    const lupiUser = lupi.connect(addr1);

    const guessHash = getGuessHash(currentNonce, 1, salt);

    const overrides = {
      value: ethers.utils.parseEther("0.001"),
    };

    await expect(lupiUser.commitGuess(guessHash, overrides)).to.be.revertedWith(
      "Must send at least TICKET_PRICE"
    );
  });

  it("Should should pay out in full to winner", async function () {
    const Lupi = (await ethers.getContractFactory("Lupi")) as Lupi__factory;
    const lupi = await Lupi.deploy();
    await lupi.deployed();
    const [_owner, addr1, addr2] = await ethers.getSigners();

    const startBalance = await addr1.getBalance();

    const currentNonce = await lupi.getCurrentNonce();
    const round = await lupi.getRound();

    const lupiUser = lupi.connect(addr1);
    let totalGasUsed: BigNumber = BigNumber.from(0);

    for (let i = 1; i < 5; i++) {
      const guessHash = getGuessHash(currentNonce, i, salt);

      const overrides = {
        value: ethers.utils.parseEther("0.01"),
      };

      const tx = await lupiUser.commitGuess(guessHash, overrides);

      const { gasUsed } = await tx.wait();
      totalGasUsed = totalGasUsed.add(gasUsed);
    }

    const guessDeadline =
      (await ethers.provider.getBlock(await ethers.provider.getBlockNumber()))
        .timestamp +
      3 * 60;
    await ethers.provider.send("evm_setNextBlockTimestamp", [guessDeadline]);
    await ethers.provider.send("evm_mine", []);

    for (let i = 1; i < 5; i++) {
      const guessHash = getGuessHash(currentNonce, i, salt);
      const tx = await lupiUser.revealGuesses([
        { round, guessHash, answer: i, salt },
      ]);
      const { gasUsed } = await tx.wait();
      totalGasUsed = totalGasUsed.add(gasUsed);
    }

    const revealDeadline =
      (await ethers.provider.getBlock(await ethers.provider.getBlockNumber()))
        .timestamp +
      3 * 60;
    await ethers.provider.send("evm_setNextBlockTimestamp", [revealDeadline]);
    await ethers.provider.send("evm_mine", []);

    const afterBalance = await addr1.getBalance();

    expect(await lupi.getCurrentBalance()).to.equal(
      BigNumber.from("40000000000000000")
    );

    expect(await lupi.getRolloverBalance()).to.equal(BigNumber.from("0"));

    await expect(lupi.endGame())
      .to.emit(lupi, "GameResult")
      .withArgs(round, addr1.address, BigNumber.from("40000000000000000"), 1);

    /*
    console.log(`totalGasUsed = ${totalGasUsed.toString()}`);
    console.log(`afterBalance = ${afterBalance.toString()}`);
    console.log(`startBalance = ${startBalance.toString()}`);
    console.log(
      `startBalance.sub(afterBalance) = ${startBalance
        .sub(afterBalance)
        .toString()}`
    );
    */
    expect(await lupi.getCurrentBalance()).to.equal(BigNumber.from("0"));
    expect(await lupi.getRolloverBalance()).to.equal(BigNumber.from("0"));
    expect(BigNumber.from("40000000000000000").sub(totalGasUsed)).to.closeTo(
      startBalance.sub(afterBalance),
      "1000000000000000"
    );
  });

  it("Should rollover balance in case of a push", async function () {
    const Lupi = (await ethers.getContractFactory("Lupi")) as Lupi__factory;
    const lupi = await Lupi.deploy();
    await lupi.deployed();
    const [_owner, addr1, addr2] = await ethers.getSigners();

    const currentNonce = await lupi.getCurrentNonce();
    const round = await lupi.getRound();

    for (let u = 0; u < 2; u++) {
      const users = [addr1, addr2];
      const lupiUser = lupi.connect(users[u]);

      for (let i = 1; i < 5; i++) {
        const guessHash = getGuessHash(currentNonce, i, salt);

        const overrides = {
          value: ethers.utils.parseEther("0.01"),
        };

        await lupiUser.commitGuess(guessHash, overrides);
      }
    }

    const guessDeadline =
      (await ethers.provider.getBlock(await ethers.provider.getBlockNumber()))
        .timestamp +
      3 * 60;
    await ethers.provider.send("evm_setNextBlockTimestamp", [guessDeadline]);
    await ethers.provider.send("evm_mine", []);

    for (let u = 0; u < 2; u++) {
      const users = [addr1, addr2];
      const lupiUser = lupi.connect(users[u]);

      for (let i = 1; i < 5; i++) {
        const guessHash = getGuessHash(currentNonce, i, salt);
        await lupiUser.revealGuesses([{ round, guessHash, answer: i, salt }]);
      }
    }

    const revealDeadline =
      (await ethers.provider.getBlock(await ethers.provider.getBlockNumber()))
        .timestamp +
      3 * 60;
    await ethers.provider.send("evm_setNextBlockTimestamp", [revealDeadline]);
    await ethers.provider.send("evm_mine", []);

    expect(await lupi.getCurrentBalance()).to.equal(
      BigNumber.from("80000000000000000")
    );

    expect(await lupi.getRolloverBalance()).to.equal(BigNumber.from("0"));

    await expect(lupi.endGame())
      .to.emit(lupi, "GameResult")
      .withArgs(round, nullAddress, 0, 0);

    expect(await lupi.getCurrentBalance()).to.equal(BigNumber.from("0"));

    expect(await lupi.getRolloverBalance()).to.equal(
      BigNumber.from("80000000000000000")
    );
  });

  it("Should should defer payment to another contract if it reverts", async function () {
    const Lupi = (await ethers.getContractFactory("Lupi")) as Lupi__factory;
    const FakeCaller = (await ethers.getContractFactory(
      "FakeCaller"
    )) as FakeCaller__factory;

    const lupi = await Lupi.deploy();
    await lupi.deployed();
    const fakeCaller = await FakeCaller.deploy(lupi.address, false);
    await fakeCaller.deployed();
    const [_owner, addr1, addr2] = await ethers.getSigners();

    const fake = fakeCaller.connect(addr1);

    const overrides = {
      value: ethers.utils.parseEther("1.00"),
    };

    const tx = await fake.fund(overrides);
    await tx.wait();

    const currentNonce = await lupi.getCurrentNonce();
    const round = await lupi.getRound();

    let totalGasUsed: BigNumber = BigNumber.from(0);

    for (let i = 1; i < 5; i++) {
      const guessHash = getGuessHash(currentNonce, i, salt);

      const overrides = {
        value: ethers.utils.parseEther("0.01"),
      };

      const tx = await fake.commitGuess(guessHash, overrides);

      const { gasUsed } = await tx.wait();
      totalGasUsed = totalGasUsed.add(gasUsed);
    }

    const guessDeadline =
      (await ethers.provider.getBlock(await ethers.provider.getBlockNumber()))
        .timestamp +
      3 * 60;
    await ethers.provider.send("evm_setNextBlockTimestamp", [guessDeadline]);
    await ethers.provider.send("evm_mine", []);

    for (let i = 1; i < 5; i++) {
      const guessHash = getGuessHash(currentNonce, i, salt);
      const tx = await fake.revealGuesses([
        { round, guessHash, answer: i, salt },
      ]);
      const { gasUsed } = await tx.wait();
      totalGasUsed = totalGasUsed.add(gasUsed);
    }

    const revealDeadline =
      (await ethers.provider.getBlock(await ethers.provider.getBlockNumber()))
        .timestamp +
      3 * 60;
    await ethers.provider.send("evm_setNextBlockTimestamp", [revealDeadline]);
    await ethers.provider.send("evm_mine", []);

    expect(await lupi.getCurrentBalance()).to.equal(
      BigNumber.from("40000000000000000")
    );

    expect(await lupi.getRolloverBalance()).to.equal(BigNumber.from("0"));

    const endGameResults = expect(lupi.endGame());
    await endGameResults.to
      .emit(lupi, "GameResult")
      .withArgs(
        round,
        fakeCaller.address,
        BigNumber.from("40000000000000000"),
        1
      );
    await endGameResults.to
      .emit(lupi, "AwardDeferred")
      .withArgs(round, fakeCaller.address, BigNumber.from("40000000000000000"));

    expect(await lupi.getCurrentBalance()).to.equal(BigNumber.from("0"));
    expect(await lupi.getRolloverBalance()).to.equal(BigNumber.from("0"));

    expect(await lupi.getPendingWinner()).to.equal(fake.address);
    await expect(fake.withdrawAward(addr1.address))
      .emit(lupi, "AwardWithdrawn")
      .withArgs(
        round,
        fakeCaller.address,
        addr1.address,
        BigNumber.from("40000000000000000")
      );
    expect(await lupi.getPendingWinner()).to.equal(nullAddress);
  });

  it("Should revert withdraw if payee reverts", async function () {
    const Lupi = (await ethers.getContractFactory("Lupi")) as Lupi__factory;
    const FakeCaller = (await ethers.getContractFactory(
      "FakeCaller"
    )) as FakeCaller__factory;

    const lupi = await Lupi.deploy();
    await lupi.deployed();
    const fakeCaller = await FakeCaller.deploy(lupi.address, false);
    await fakeCaller.deployed();
    const [_owner, addr1, addr2] = await ethers.getSigners();

    const fake = fakeCaller.connect(addr1);

    const overrides = {
      value: ethers.utils.parseEther("1.00"),
    };

    const tx = await fake.fund(overrides);
    await tx.wait();

    const currentNonce = await lupi.getCurrentNonce();
    const round = await lupi.getRound();

    let totalGasUsed: BigNumber = BigNumber.from(0);

    for (let i = 1; i < 5; i++) {
      const guessHash = getGuessHash(currentNonce, i, salt);

      const overrides = {
        value: ethers.utils.parseEther("0.01"),
      };

      const tx = await fake.commitGuess(guessHash, overrides);

      const { gasUsed } = await tx.wait();
      totalGasUsed = totalGasUsed.add(gasUsed);
    }

    const guessDeadline =
      (await ethers.provider.getBlock(await ethers.provider.getBlockNumber()))
        .timestamp +
      3 * 60;
    await ethers.provider.send("evm_setNextBlockTimestamp", [guessDeadline]);
    await ethers.provider.send("evm_mine", []);

    for (let i = 1; i < 5; i++) {
      const guessHash = getGuessHash(currentNonce, i, salt);
      const tx = await fake.revealGuesses([
        { round, guessHash, answer: i, salt },
      ]);
      const { gasUsed } = await tx.wait();
      totalGasUsed = totalGasUsed.add(gasUsed);
    }

    const revealDeadline =
      (await ethers.provider.getBlock(await ethers.provider.getBlockNumber()))
        .timestamp +
      3 * 60;
    await ethers.provider.send("evm_setNextBlockTimestamp", [revealDeadline]);
    await ethers.provider.send("evm_mine", []);

    expect(await lupi.getCurrentBalance()).to.equal(
      BigNumber.from("40000000000000000")
    );

    expect(await lupi.getRolloverBalance()).to.equal(BigNumber.from("0"));

    const endGameResults = expect(lupi.endGame());
    await endGameResults.to
      .emit(lupi, "GameResult")
      .withArgs(
        round,
        fakeCaller.address,
        BigNumber.from("40000000000000000"),
        1
      );
    await endGameResults.to
      .emit(lupi, "AwardDeferred")
      .withArgs(round, fakeCaller.address, BigNumber.from("40000000000000000"));

    expect(await lupi.getCurrentBalance()).to.equal(BigNumber.from("0"));
    expect(await lupi.getRolloverBalance()).to.equal(BigNumber.from("0"));

    expect(await lupi.getPendingWinner()).to.equal(fake.address);
    await fake.setAcceptPayment(false);
    await expect(fake.withdrawAward(fake.address)).to.be.revertedWith(
      "withdrawAward unable to send value"
    );
    expect(await lupi.getPendingWinner()).to.equal(fake.address);
  });

  it("Should revert withdraw if payee sends null address", async function () {
    const Lupi = (await ethers.getContractFactory("Lupi")) as Lupi__factory;
    const FakeCaller = (await ethers.getContractFactory(
      "FakeCaller"
    )) as FakeCaller__factory;

    const lupi = await Lupi.deploy();
    await lupi.deployed();
    const fakeCaller = await FakeCaller.deploy(lupi.address, false);
    await fakeCaller.deployed();
    const [_owner, addr1, addr2] = await ethers.getSigners();

    const fake = fakeCaller.connect(addr1);

    const overrides = {
      value: ethers.utils.parseEther("1.00"),
    };

    const tx = await fake.fund(overrides);
    await tx.wait();

    const currentNonce = await lupi.getCurrentNonce();
    const round = await lupi.getRound();

    let totalGasUsed: BigNumber = BigNumber.from(0);

    for (let i = 1; i < 5; i++) {
      const guessHash = getGuessHash(currentNonce, i, salt);

      const overrides = {
        value: ethers.utils.parseEther("0.01"),
      };

      const tx = await fake.commitGuess(guessHash, overrides);

      const { gasUsed } = await tx.wait();
      totalGasUsed = totalGasUsed.add(gasUsed);
    }

    const guessDeadline =
      (await ethers.provider.getBlock(await ethers.provider.getBlockNumber()))
        .timestamp +
      3 * 60;
    await ethers.provider.send("evm_setNextBlockTimestamp", [guessDeadline]);
    await ethers.provider.send("evm_mine", []);

    for (let i = 1; i < 5; i++) {
      const guessHash = getGuessHash(currentNonce, i, salt);
      const tx = await fake.revealGuesses([
        { round, guessHash, answer: i, salt },
      ]);
      const { gasUsed } = await tx.wait();
      totalGasUsed = totalGasUsed.add(gasUsed);
    }

    const revealDeadline =
      (await ethers.provider.getBlock(await ethers.provider.getBlockNumber()))
        .timestamp +
      3 * 60;
    await ethers.provider.send("evm_setNextBlockTimestamp", [revealDeadline]);
    await ethers.provider.send("evm_mine", []);

    expect(await lupi.getCurrentBalance()).to.equal(
      BigNumber.from("40000000000000000")
    );

    expect(await lupi.getRolloverBalance()).to.equal(BigNumber.from("0"));

    const endGameResults = expect(lupi.endGame());
    await endGameResults.to
      .emit(lupi, "GameResult")
      .withArgs(
        round,
        fakeCaller.address,
        BigNumber.from("40000000000000000"),
        1
      );
    await endGameResults.to
      .emit(lupi, "AwardDeferred")
      .withArgs(round, fakeCaller.address, BigNumber.from("40000000000000000"));

    expect(await lupi.getCurrentBalance()).to.equal(BigNumber.from("0"));
    expect(await lupi.getRolloverBalance()).to.equal(BigNumber.from("0"));

    expect(await lupi.getPendingWinner()).to.equal(fake.address);
    await expect(fake.withdrawAward(nullAddress)).to.be.revertedWith(
      "Not allowed to transfer to address(0)"
    );
    expect(await lupi.getPendingWinner()).to.equal(fake.address);
  });

  it("Should should forfeit payment to another contract if it doesn't claim before next round", async function () {
    const Lupi = (await ethers.getContractFactory("Lupi")) as Lupi__factory;
    const FakeCaller = (await ethers.getContractFactory(
      "FakeCaller"
    )) as FakeCaller__factory;

    const lupi = await Lupi.deploy();
    await lupi.deployed();
    const fakeCaller = await FakeCaller.deploy(lupi.address, false);
    await fakeCaller.deployed();
    const [_owner, addr1, addr2] = await ethers.getSigners();

    const fake = fakeCaller.connect(addr1);

    const overrides = {
      value: ethers.utils.parseEther("1.00"),
    };

    const tx = await fake.fund(overrides);
    await tx.wait();

    const currentNonce = await lupi.getCurrentNonce();
    const round = await lupi.getRound();

    let totalGasUsed: BigNumber = BigNumber.from(0);

    for (let i = 1; i < 5; i++) {
      const guessHash = getGuessHash(currentNonce, i, salt);

      const overrides = {
        value: ethers.utils.parseEther("0.01"),
      };

      const tx = await fake.commitGuess(guessHash, overrides);

      const { gasUsed } = await tx.wait();
      totalGasUsed = totalGasUsed.add(gasUsed);
    }

    const guessDeadline =
      (await ethers.provider.getBlock(await ethers.provider.getBlockNumber()))
        .timestamp +
      3 * 60;
    await ethers.provider.send("evm_setNextBlockTimestamp", [guessDeadline]);
    await ethers.provider.send("evm_mine", []);

    for (let i = 1; i < 5; i++) {
      const guessHash = getGuessHash(currentNonce, i, salt);
      const tx = await fake.revealGuesses([
        { round, guessHash, answer: i, salt },
      ]);
      const { gasUsed } = await tx.wait();
      totalGasUsed = totalGasUsed.add(gasUsed);
    }

    const revealDeadline =
      (await ethers.provider.getBlock(await ethers.provider.getBlockNumber()))
        .timestamp +
      3 * 60;
    await ethers.provider.send("evm_setNextBlockTimestamp", [revealDeadline]);
    await ethers.provider.send("evm_mine", []);

    expect(await lupi.getCurrentBalance()).to.equal(
      BigNumber.from("40000000000000000")
    );

    expect(await lupi.getRolloverBalance()).to.equal(BigNumber.from("0"));

    const endGameResults = expect(lupi.endGame());
    await endGameResults.to
      .emit(lupi, "GameResult")
      .withArgs(
        round,
        fakeCaller.address,
        BigNumber.from("40000000000000000"),
        1
      );
    await endGameResults.to
      .emit(lupi, "AwardDeferred")
      .withArgs(round, fakeCaller.address, BigNumber.from("40000000000000000"));

    expect(await lupi.getCurrentBalance()).to.equal(BigNumber.from("0"));
    expect(await lupi.getRolloverBalance()).to.equal(BigNumber.from("0"));
    expect(await lupi.getPendingWinner()).to.equal(fake.address);

    const secondDeadline =
      (await ethers.provider.getBlock(await ethers.provider.getBlockNumber()))
        .timestamp +
      7 * 24 * 60 * 60;
    await ethers.provider.send("evm_setNextBlockTimestamp", [secondDeadline]);
    await ethers.provider.send("evm_mine", []);

    const secondRound = await lupi.getRound();

    const secondEndGameResults = expect(lupi.endGame());

    await secondEndGameResults.to
      .emit(lupi, "GameResult")
      .withArgs(secondRound, nullAddress, 0, 0);
    await secondEndGameResults.to
      .emit(lupi, "AwardForfeited")
      .withArgs(round, fakeCaller.address, BigNumber.from("40000000000000000"));

    expect(await lupi.getCurrentBalance()).to.equal(BigNumber.from("0"));
    expect(await lupi.getRolloverBalance()).to.equal(
      BigNumber.from("40000000000000000")
    );
    expect(await lupi.getPendingWinner()).to.equal(nullAddress);

    await expect(fake.withdrawAward(addr1.address)).to.be.revertedWith(
      "Only the winning address may withdraw"
    );
  });

  it("Should should pay to another contract", async function () {
    const Lupi = (await ethers.getContractFactory("Lupi")) as Lupi__factory;
    const FakeCaller = (await ethers.getContractFactory(
      "FakeCaller"
    )) as FakeCaller__factory;

    const lupi = await Lupi.deploy();
    await lupi.deployed();
    const fakeCaller = await FakeCaller.deploy(lupi.address, true);
    await fakeCaller.deployed();
    const [_owner, addr1, addr2] = await ethers.getSigners();

    const fake = fakeCaller.connect(addr1);

    const overrides = {
      value: ethers.utils.parseEther("1.00"),
    };

    const tx = await fake.fund(overrides);
    await tx.wait();

    const startBalance = await addr1.getBalance();

    const currentNonce = await lupi.getCurrentNonce();
    const round = await lupi.getRound();

    let totalGasUsed: BigNumber = BigNumber.from(0);

    for (let i = 1; i < 5; i++) {
      const guessHash = getGuessHash(currentNonce, i, salt);

      const overrides = {
        value: ethers.utils.parseEther("0.01"),
      };

      const tx = await fake.commitGuess(guessHash, overrides);

      const { gasUsed } = await tx.wait();
      totalGasUsed = totalGasUsed.add(gasUsed);
    }

    const guessDeadline =
      (await ethers.provider.getBlock(await ethers.provider.getBlockNumber()))
        .timestamp +
      3 * 60;
    await ethers.provider.send("evm_setNextBlockTimestamp", [guessDeadline]);
    await ethers.provider.send("evm_mine", []);

    for (let i = 1; i < 5; i++) {
      const guessHash = getGuessHash(currentNonce, i, salt);
      const tx = await fake.revealGuesses([
        { round, guessHash, answer: i, salt },
      ]);
      const { gasUsed } = await tx.wait();
      totalGasUsed = totalGasUsed.add(gasUsed);
    }

    const revealDeadline =
      (await ethers.provider.getBlock(await ethers.provider.getBlockNumber()))
        .timestamp +
      3 * 60;
    await ethers.provider.send("evm_setNextBlockTimestamp", [revealDeadline]);
    await ethers.provider.send("evm_mine", []);

    const afterBalance = await addr1.getBalance();

    expect(await lupi.getCurrentBalance()).to.equal(
      BigNumber.from("40000000000000000")
    );

    expect(await lupi.getRolloverBalance()).to.equal(BigNumber.from("0"));

    const endGameResults = expect(lupi.endGame());
    await endGameResults.to
      .emit(lupi, "GameResult")
      .withArgs(
        round,
        fakeCaller.address,
        BigNumber.from("40000000000000000"),
        1
      );

    expect(await lupi.getPendingWinner()).to.equal(nullAddress);

    expect(await lupi.getCurrentBalance()).to.equal(BigNumber.from("0"));
    expect(await lupi.getRolloverBalance()).to.equal(BigNumber.from("0"));
    expect(BigNumber.from("40000000000000000").sub(totalGasUsed)).to.closeTo(
      startBalance.sub(afterBalance),
      "1000000000000000"
    );
  });

  it("Should should return excess eth from commitGuess", async function () {
    const Lupi = (await ethers.getContractFactory("Lupi")) as Lupi__factory;
    const lupi = await Lupi.deploy();
    await lupi.deployed();
    const [owner, addr1, addr2] = await ethers.getSigners();

    const balance = await addr1.getBalance();

    const currentNonce = await lupi.getCurrentNonce();

    const lupiUser = lupi.connect(addr1);

    const guessHash = getGuessHash(currentNonce, 1, salt);

    const overrides = {
      value: ethers.utils.parseEther("0.02"),
    };

    const tx = await lupiUser.commitGuess(guessHash, overrides);

    const { gasUsed } = await tx.wait();

    const afterBalance = await addr1.getBalance();
    expect(
      BigNumber.from("10000000000000000") ===
        balance.sub(afterBalance).add(gasUsed)
    );
  });
});
