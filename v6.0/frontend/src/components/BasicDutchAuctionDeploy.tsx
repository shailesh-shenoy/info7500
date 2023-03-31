import { useWeb3React } from '@web3-react/core';
import { Contract, ethers, Signer } from 'ethers';
import {
  ChangeEvent,
  MouseEvent,
  ReactElement,
  useEffect,
  useState
} from 'react';
import styled from 'styled-components';
import BasicDutchAuctionArtifact from '../artifacts/contracts/BasicDutchAuction.sol/BasicDutchAuction.json';
import { Provider } from '../utils/provider';
import { SectionDivider } from './SectionDivider';

const StyledDeployContractButton = styled.button`
  width: 180px;
  height: 2rem;
  border-radius: 1rem;
  border-color: blue;
  cursor: pointer;
  place-self: center;
`;

const StyledAuctionDiv = styled.div`
  display: grid;
  grid-template-rows: 1fr 1fr 1fr;
  grid-template-columns: 135px 2.7fr 1fr;
  grid-gap: 10px;
  place-self: center;
  align-items: center;
`;

const StyledLabel = styled.label`
  font-weight: bold;
`;

const StyledInput = styled.input`
  padding: 0.4rem 0.6rem;
  line-height: 2fr;
`;

const StyledButton = styled.button`
  width: 150px;
  height: 2rem;
  border-radius: 1rem;
  border-color: blue;
  cursor: pointer;
`;

export function BasicDutchAuctionDeploy(): ReactElement {
  const context = useWeb3React<Provider>();
  const { library, active } = context;

  const [signer, setSigner] = useState<Signer>();
  const [auctionContract, setAuctionContract] = useState<Contract>();
  const [auctionContractAddr, setAuctionContractAddr] = useState<string>('');
  const [initialPrice, setInitialPrice] = useState<string>('');
  const [initialPriceInput, setInitialPriceInput] = useState<string>('');

  useEffect((): void => {
    if (!library) {
      setSigner(undefined);
      return;
    }

    setSigner(library.getSigner());
  }, [library]);

  useEffect((): void => {
    if (!auctionContract) {
      return;
    }

    async function getInitialPrice(auctionContract: Contract): Promise<void> {
      const _initialPrice = await auctionContract.initialPrice();

      if (_initialPrice.toNumber() !== initialPrice) {
        setInitialPrice(_initialPrice.toNumber());
      }
    }

    getInitialPrice(auctionContract);
  }, [auctionContract, initialPrice]);

  function handleDeployContract(event: MouseEvent<HTMLButtonElement>) {
    event.preventDefault();

    // only deploy the Greeter contract one time, when a signer is defined
    if (auctionContract || !signer) {
      return;
    }

    async function deployAuctionContract(signer: Signer): Promise<void> {
      const AuctionContract = new ethers.ContractFactory(
        BasicDutchAuctionArtifact.abi,
        BasicDutchAuctionArtifact.bytecode,
        signer
      );

      try {
        const auctionContract = await AuctionContract.deploy(500, 100, 50);

        await auctionContract.deployed();
        console.log('deployed');
        const initialPrice = await auctionContract.initialPrice();
        console.log(initialPrice);
        setAuctionContract(auctionContract);
        setInitialPrice(initialPrice.toNumber());

        window.alert(
          `Basic Dutch Auction contract deployed to: ${auctionContract.address}`
        );

        setAuctionContractAddr(auctionContract.address);
      } catch (error: any) {
        window.alert(
          'Error!' + (error && error.message ? `\n\n${error.message}` : '')
        );
      }
    }

    deployAuctionContract(signer);
  }

  // function handleGreetingChange(event: ChangeEvent<HTMLInputElement>): void {
  //   event.preventDefault();
  //   setGreetingInput(event.target.value);
  // }

  // function handleAuctionSubmit(event: MouseEvent<HTMLButtonElement>): void {
  //   event.preventDefault();

  //   if (!auctionContract) {
  //     window.alert('Undefined auctionContract');
  //     return;
  //   }

  //   if (!greetingInput) {
  //     window.alert('Greeting cannot be empty');
  //     return;
  //   }

  //   async function submitGreeting(greeterContract: Contract): Promise<void> {
  //     try {
  //       const setGreetingTxn = await greeterContract.setGreeting(greetingInput);

  //       await setGreetingTxn.wait();

  //       const newGreeting = await greeterContract.greet();
  //       window.alert(`Success!\n\nGreeting is now: ${newGreeting}`);

  //       if (newGreeting !== greeting) {
  //         setGreeting(newGreeting);
  //       }
  //     } catch (error: any) {
  //       window.alert(
  //         'Error!' + (error && error.message ? `\n\n${error.message}` : '')
  //       );
  //     }
  //   }

  //   submitGreeting(greeterContract);
  // }

  return (
    <>
      <StyledDeployContractButton
        disabled={!active || auctionContract ? true : false}
        style={{
          cursor: !active || auctionContract ? 'not-allowed' : 'pointer',
          borderColor: !active || auctionContract ? 'unset' : 'blue'
        }}
        onClick={handleDeployContract}
      >
        Deploy Auction Contract
      </StyledDeployContractButton>
      <SectionDivider />
      <StyledAuctionDiv>
        <StyledLabel>Contract addr</StyledLabel>
        <div>
          {auctionContractAddr ? (
            auctionContractAddr
          ) : (
            <em>{`<Contract not yet deployed>`}</em>
          )}
        </div>
        {/* empty placeholder div below to provide empty first row, 3rd col div for a 2x3 grid */}
        <div></div>
        <StyledLabel>Initial Price</StyledLabel>
        <div>
          {initialPrice ? (
            initialPrice
          ) : (
            <em>{`<Contract not yet deployed>`}</em>
          )}
        </div>
        {/* empty placeholder div below to provide empty first row, 3rd col div for a 2x3 grid */}
        <div></div>
        {/* <StyledLabel htmlFor="greetingInput">Set new greeting</StyledLabel>
        <StyledInput
          id="greetingInput"
          type="text"
          placeholder={greeting ? '' : '<Contract not yet deployed>'}
          onChange={handleGreetingChange}
          style={{ fontStyle: greeting ? 'normal' : 'italic' }}
        ></StyledInput>
        <StyledButton
          disabled={!active || !greeterContract ? true : false}
          style={{
            cursor: !active || !greeterContract ? 'not-allowed' : 'pointer',
            borderColor: !active || !greeterContract ? 'unset' : 'blue'
          }}
          onClick={handleGreetingSubmit}
        >
          Submit
        </StyledButton> */}
      </StyledAuctionDiv>
    </>
  );
}
