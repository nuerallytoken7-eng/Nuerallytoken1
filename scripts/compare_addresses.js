
const storedAddress = "0x0567f2323251F0aaB15fC0bd16f0F5D30716422b";
const realAddress = "0x0567F2323251f0Aab15fc0bD16FD30716422b";

console.log("Stored:", storedAddress);
console.log("Real:  ", realAddress);

console.log("Stored Len:", storedAddress.length);
console.log("Real Len:  ", realAddress.length);

if (storedAddress.toLowerCase() === realAddress.toLowerCase()) {
    console.log("Addresses MATCH (case insensitive)");
} else {
    console.log("Addresses DO NOT MATCH");
}
