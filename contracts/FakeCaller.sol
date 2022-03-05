//SPDX-License-Identifier: Apache-2.0

/******************************************************************************
 * Copyright 2022 Here Not There, Inc. <oss@hntlabs.com>                      *
 *                                                                            *
 * Licensed under the Apache License, Version 2.0 (the "License");            *
 * you may not use this file except in compliance with the License.           *
 * You may obtain a copy of the License at                                    *
 *                                                                            *
 *     http://www.apache.org/licenses/LICENSE-2.0                             *
 *                                                                            *
 * Unless required by applicable law or agreed to in writing, software        *
 * distributed under the License is distributed on an "AS IS" BASIS,          *
 * WITHOUT WARRANTIES OR CONDITIONS OF ANY KIND, either express or implied.   *
 * See the License for the specific language governing permissions and        *
 * limitations under the License.                                             *
 ******************************************************************************/

pragma solidity ^0.8.0;

import "hardhat/console.sol";
import "./Lupi.sol";

contract FakeCaller {
  bool private acceptsPayment;
  Lupi private lupi;

  constructor(Lupi _lupi, bool _acceptsPayment) {
    lupi = _lupi;
    acceptsPayment = _acceptsPayment;
  }

  function fund() external payable {
    console.log("FakeCaller funded", msg.value);
  }

  receive() external payable {
    require(acceptsPayment, "Reverted");
  }

  function setAcceptPayment(bool _acceptsPayment) external {
    acceptsPayment = _acceptsPayment;
  }

  function commitGuess(bytes32 guessHash) external payable {
    lupi.commitGuess{value: msg.value}(guessHash);
  }

  function revealGuesses(Lupi.Reveal[] calldata reveals) external {
    lupi.revealGuesses(reveals);
  }

  function withdrawAward(address payable payee) external {
    lupi.withdrawAward(payee);
  }
}
