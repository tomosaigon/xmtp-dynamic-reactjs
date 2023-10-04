import {
    useSismoConnect,
    SismoConnectButton,
    AuthType,
    // SismoConnectResponse,
    // ClaimType,
} from "@sismo-core/sismo-connect-react";
const SISMO_CONNECT_APP_ID = "0x2cc3a0560a713f648168c37919b5e7c8";

const config = {
    // displayRawResponse: true,
    appId: SISMO_CONNECT_APP_ID,
}

// Usdc Eth Lpers
// const GROUP_ID = "0x3b8e71562df9eca2edc0a94d18545257";
// Data Group of SisterMothers
const GROUP_ID = "0x5f52cf60d2daf39e7faf41a3b86673b9";
// const jsonListData0 = {
//     "0x38378e4150d29B916C72A835bF3450b8BeA2C0c0": "1",
//     "0xf7B8413e38De558B5b8dC0090f124857B8FAa5d7": "1",
//     "0x20E7D6E39D24944568607e89FC164dCb3A03D7EB": "1",
//     "0xF4ba41659654A95307F47a6Aba6c7Bf238fD4cdB": "1",
// };

const MESSAGE = "I wanna chat with my SisterMothers";

function Sismo({ setSismoResponse }) {
    const { response, responseBytes, sismoConnect } = useSismoConnect({ config })
    return (
        <div>
            {/* {response && <div>Sismo Connected, response: {JSON.stringify(response)}</div>} */}
            <SismoConnectButton
                config={config}
                auths={[{ authType: AuthType.VAULT }]}
                claims={[
                    { groupId: GROUP_ID },
                ]}
                signature={{ message: MESSAGE }}
                // retrieve the Sismo Connect Reponse from the user's Sismo data vault
                onResponse={async (response__) => {
                    console.log("response__", response__);
                    setSismoResponse(response__);

                    // onResponse={async (response: SismoConnectResponse) => {
                    // const res = await fetch("/api/verify", {
                    //   method: "POST",
                    //   body: JSON.stringify(response),
                    // });
                    // console.log(await res.json());
                }}
            // reponse in bytes to call a contract
            // onResponseBytes={async (response: string) => {
            //   console.log(response);
            // }}
            />
        </div>
    )
}


export default Sismo;
