export default function handler(req, res) {
    // get tokenId from query params
    const tokenId = req.query.tokenId;
    // as images are uploaded to github, can extract from github directly
    const image_url = "https://raw.githubusercontent.com/LearnWeb3DAO/NFT-Collection/main/my-app/public/cryptodevs/";
    // api is sending back metadata for a NFT img
    // metadata standards for opensea when sending back response from API
    res.status(200).json({
        name: "Crypto Dev #" + tokenId,
        description: "Crypto Dev is a collection of developers in crypto",
        image: image_url + tokenId +".svg",
    });
}