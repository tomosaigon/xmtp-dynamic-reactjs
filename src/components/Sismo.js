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


function Sismo({ setSismoResponse }) {
    const { response, responseBytes, sismoConnect } = useSismoConnect({ config })
    return (
        <div>
            {response && <div>response: {JSON.stringify(response)}</div>}
            <SismoConnectButton
                config={config}
                auths={[{ authType: AuthType.VAULT }]}
                claims={[
                    // Usdc Eth Lpers
                    { groupId: "0x3b8e71562df9eca2edc0a94d18545257" },
                ]}
                signature={{ message: "I wanna chat with other USDC/ETH LPers" }}
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
