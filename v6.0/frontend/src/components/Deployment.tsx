import {
  Button,
  FormControl,
  FormHelperText,
  FormLabel,
  Heading,
  Input,
  InputGroup,
  InputRightAddon,
  Stack,
  useToast
} from '@chakra-ui/react';
import { Web3Provider } from '@ethersproject/providers';
import { useWeb3React } from '@web3-react/core';
import { Contract, Signer, ethers } from 'ethers';
import { useEffect, useState } from 'react';

import BasicDutchAuctionArtifact from '../artifacts/contracts/BasicDutchAuction.sol/BasicDutchAuction.json';

export default function Deployment() {
  const [reservePrice, setReservePrice] = useState('');
  const [auctionDuration, setAuctionDuration] = useState('');
  const [decrementPerBlock, setDecrementPerBlock] = useState('');

  const toast = useToast();

  const { active, library } = useWeb3React<Web3Provider>();
  const [signer, setSigner] = useState<Signer>();
  const [basicDutchAuctionContract, setBasicDutchAuctionContract] =
    useState<Contract>();
  const [basicDutchAuctioContractAddr, setBasicDutchAuctionContractAddr] =
    useState<string>('');

  useEffect((): void => {
    if (!library) {
      setSigner(undefined);
      return;
    }

    setSigner(library.getSigner());
  }, [library]);

  return (
    <Stack direction="column" spacing="6">
      <Heading as="h2">Deployment</Heading>
      <form onSubmit={handleDeploy}>
        <FormControl isRequired>
          <FormLabel>Reserve Price</FormLabel>
          <InputGroup>
            <Input
              variant="outline"
              bg="white"
              type="number"
              placeholder="10000"
              width="20rem"
              value={reservePrice}
              onChange={(event) => setReservePrice(event.target.value)}
            />
            <InputRightAddon bg="green.100" children="WEI" />
          </InputGroup>
          <FormHelperText>
            Lowest/Base price of the Auctioned item in wei
          </FormHelperText>
        </FormControl>
        <FormControl mt={6} isRequired>
          <FormLabel>Auction Duration</FormLabel>
          <InputGroup>
            <Input
              variant="outline"
              bg="white"
              type="number"
              placeholder="20"
              width="20rem"
              value={auctionDuration}
              onChange={(event) => setAuctionDuration(event.target.value)}
            />
            <InputRightAddon bg="green.100" children="BLOCKS" />
          </InputGroup>
          <FormHelperText>
            Number of blocks the auction remains open
          </FormHelperText>
        </FormControl>
        <FormControl mt={6} isRequired>
          <FormLabel>Decrement per block</FormLabel>
          <InputGroup>
            <Input
              variant="outline"
              bg="white"
              type="number"
              placeholder="500"
              width="20rem"
              value={decrementPerBlock}
              onChange={(event) => setDecrementPerBlock(event.target.value)}
            />
            <InputRightAddon bg="green.100" children="WEI" />
          </InputGroup>
          <FormHelperText>Decrement in offer price per block</FormHelperText>
        </FormControl>
        <Button
          variant="solid"
          mt={6}
          colorScheme="blue"
          type="submit"
          width="10rem"
        >
          Deploy
        </Button>
      </form>
    </Stack>
  );

  async function handleDeploy(event: any) {
    event.preventDefault();

    // only deploy the Greeter contract one time, when a signer is defined
    if (basicDutchAuctionContract || !signer) {
      return;
    }

    const BasicDutchAuctionContract = new ethers.ContractFactory(
      BasicDutchAuctionArtifact.abi,
      BasicDutchAuctionArtifact.bytecode,
      signer
    );

    try {
      const _basicDutchAuctionContract = await BasicDutchAuctionContract.deploy(
        reservePrice,
        auctionDuration,
        decrementPerBlock
      );
      await _basicDutchAuctionContract.deployed();
      setBasicDutchAuctionContract(_basicDutchAuctionContract);
      setBasicDutchAuctionContractAddr(_basicDutchAuctionContract.address);
      toast({
        title: 'Success',
        description: `Basic Dutch Auction contract deployed to address ${_basicDutchAuctionContract.address}`,
        status: 'success',
        duration: 9000,
        isClosable: true
      });
    } catch (error: any) {
      console.log(error);
      toast({
        title: 'Error while deploying Basic Dutch Auction contract',
        description: error?.message,
        status: 'error',
        duration: 9000,
        isClosable: true
      });
    }
  }
}
