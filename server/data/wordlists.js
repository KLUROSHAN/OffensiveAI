// ═══════════════════════════════════════════════════════════
// EXPANDED WORDLIST — 1000+ common passwords + rule mutations
// For real dictionary & hybrid attacks
// ═══════════════════════════════════════════════════════════
import crypto from 'crypto';

export const commonPasswords = [
    'password', '123456', '12345678', 'qwerty', 'abc123', 'monkey', '1234567', 'letmein',
    'trustno1', 'dragon', 'baseball', 'iloveyou', 'master', 'sunshine', 'ashley', 'bailey',
    'shadow', '123123', '654321', 'superman', 'qazwsx', 'michael', 'football', 'password1',
    'password123', 'batman', 'login', 'admin', 'princess', 'starwars', 'solo', '1q2w3e4r',
    'passw0rd', 'welcome', 'hello', 'charlie', 'donald', 'loveme', 'hockey', 'freedom',
    'whatever', 'nicole', 'jordan', 'cameron', 'secret', 'summer', 'buster', 'ranger',
    'harley', 'dakota', 'thomas', 'robert', 'soccer', 'access', 'mustang', 'thunder',
    'taylor', 'matrix', 'william', 'corvette', 'hello1', 'maggie', 'ginger', 'hammer',
    'silver', 'anthony', 'bigdog', 'spanky', 'enter', '112233', 'andrew', 'joshua', 'andrea',
    'spider', 'peaches', 'jennifer', 'rachel', 'jasmine', 'brandon', 'george', 'daniel',
    'jessica', 'stargate', 'computer', 'samantha', 'amanda', 'cookie', 'abcdef', 'jackson',
    'maverick', 'steelers', 'cheese', 'merlin', 'testing', 'midnight', '11111111', '88888888',
    '00000000', 'internet', 'pepper', 'yankees', 'winner', 'tigger', 'orange', 'killer',
    'flower', 'service', 'canada', 'peanut', 'sparky', 'qwerty123', 'letmein1', 'welcome1',
    '1234qwer', 'monkey123', 'dragon1', 'master1', 'sunshine1', 'shadow1', 'football1',
    'baseball1', 'soccer1', 'hockey1', 'jordan23', '1qaz2wsx', 'zaq12wsx', 'qwe123',
    'p@ssw0rd', 'p@ssword', 'p@ss1234', 'ch@ngeme', 'adm1n', 'r00t', 'pa$$word',
    'Pa$$w0rd', 'passw0rd!', 'Summer2024', 'Winter2024', 'Spring2024', 'company123',
    'Company1', 'Welcome1', 'Welcome123', 'Changeme1', 'Qwerty1', '1234567890',
    'Password1', 'Password123', 'Admin123', 'Root123', 'test', 'test123', 'test1234',
    'guest', 'guest123', 'love', 'sexy', 'god', 'ninja', 'hunter', 'black', 'white',
    'purple', 'sammy', 'daniel', 'david', 'jennifer', 'thomas', 'marina', 'austin',
    'madison', 'dallas', 'genesis', 'phoenix', 'angel', 'heaven', 'angel1', 'heaven1',
    'newyork', 'london', 'paris', 'tokyo', 'berlin', 'moscow', 'sydney', 'boston',
    'chicago', 'denver', 'seattle', 'austin1', 'dallas1', 'boston1', 'chicago1',
    'january', 'february', 'march', 'april', 'may', 'june', 'july', 'august',
    'september', 'october', 'november', 'december', 'monday', 'tuesday', 'wednesday',
    'thursday', 'friday', 'saturday', 'sunday', 'spring', 'winter', 'autumn', 'fall',
    'diamond', 'platinum', 'crystal', 'emerald', 'sapphire', 'ruby', 'pearl', 'amber',
    'soccer1', 'tennis', 'swimming', 'cricket', 'rugby', 'boxing', 'skiing', 'surfing',
    'guitar', 'piano', 'violin', 'drums', 'music', 'melody', 'harmony', 'rhythm',
    'apple', 'banana', 'cherry', 'grape', 'mango', 'peach', 'strawberry', 'blueberry',
    'tiger', 'lion', 'eagle', 'wolf', 'shark', 'panther', 'cobra', 'python', 'viper',
    'falcon', 'hawk', 'raven', 'crow', 'sparrow', 'robin', 'phoenix1', 'dragon2',
    'ferrari', 'porsche', 'mercedes', 'bmw', 'audi', 'lexus', 'toyota', 'honda', 'ford',
    'chevy', 'dodge', 'jeep', 'tesla', 'nissan', 'mazda', 'subaru', 'volvo', 'hyundai',
    'minecraft', 'fortnite', 'roblox', 'pokemon', 'mario', 'zelda', 'sonic', 'pikachu',
    'xbox', 'playstation', 'nintendo', 'gamer', 'gaming', 'esports', 'twitch', 'youtube',
    'facebook', 'twitter', 'instagram', 'tiktok', 'snapchat', 'reddit', 'discord',
    'google', 'amazon', 'netflix', 'spotify', 'apple1', 'microsoft', 'samsung',
    'america', 'freedom1', 'liberty', 'justice', 'patriot', 'marine', 'army', 'navy',
    'airforce', 'soldier', 'warrior', 'champion', 'winner1', 'victory', 'legend',
    'rocket', 'satellite', 'galaxy', 'nebula', 'cosmos', 'quantum', 'atomic', 'nuclear',
    'hacker', 'cyber', 'digital', 'binary', 'matrix1', 'system', 'kernel', 'daemon',
    'backdoor', 'exploit', 'malware', 'virus', 'trojan', 'worm', 'rootkit', 'payload',
    'encrypt', 'decrypt', 'cipher', 'hash', 'token', 'firewall', 'proxy', 'tunnel',
    'alpha', 'bravo', 'charlie1', 'delta', 'echo', 'foxtrot', 'golf', 'hotel',
    'india', 'juliet', 'kilo', 'lima', 'mike', 'november1', 'oscar', 'papa',
    'quebec', 'romeo', 'sierra', 'tango', 'uniform', 'victor', 'whiskey', 'xray', 'yankee', 'zulu',
    'chocolate', 'vanilla', 'caramel', 'coffee', 'espresso', 'latte', 'mocha', 'cappuccino',
    'openai', 'chatgpt', 'gpt4', 'gemini', 'claude', 'alexa', 'siri', 'cortana',
    'bitcoin', 'ethereum', 'crypto1', 'blockchain', 'defi', 'nft', 'web3', 'metaverse',
    'deepfake', 'ransomware', 'phishing', 'spoofing', 'keylogger', 'botnet', 'zero0day',
    '123', '1234', '12345', '123456789', '0000', '1111', '2222', '3333', '4444',
    '5555', '6666', '7777', '8888', '9999', '0123', '9876', '5678', '4321',
    'aaa', 'bbb', 'ccc', 'zzz', 'xxx', 'qqq', 'abc', 'xyz', 'asd', 'zxc',
    'qweasd', 'asdzxc', 'q1w2e3', '1a2b3c', 'a1b2c3', 'z1x2c3',
    'iloveu', 'ihateu', 'loveyou', 'missyou', 'kissme', 'hugme',
    'baseball2', 'football2', 'soccer2', 'tennis1', 'boxing1',
    'starwars1', 'batman1', 'superman1', 'spiderman', 'ironman', 'hulk', 'thor',
    'captainamerica', 'blackpanther', 'deadpool', 'wolverine', 'joker', 'harleyquinn',
    'gandalf', 'frodo', 'aragorn', 'legolas', 'dumbledore', 'voldemort', 'hermione', 'potter',
    'vader', 'skywalker', 'obiwan', 'yoda', 'chewbacca', 'r2d2', 'c3po', 'boba',
    'rickmorty', 'simpsons', 'futurama', 'spongebob', 'patrick', 'squidward',
    'pirate', 'ninja1', 'samurai', 'knight', 'warrior1', 'assassin', 'templar',
    'sentinel', 'guardian', 'defender', 'protector', 'sentinel1',
];

export const commonNames = [
    'james', 'john', 'robert', 'michael', 'william', 'david', 'richard', 'joseph',
    'thomas', 'charles', 'mary', 'patricia', 'jennifer', 'linda', 'elizabeth',
    'barbara', 'susan', 'jessica', 'sarah', 'karen', 'nancy', 'lisa', 'betty',
    'margaret', 'sandra', 'ashley', 'emma', 'olivia', 'sophia', 'isabella',
    'mia', 'charlotte', 'amelia', 'harper', 'evelyn', 'daniel', 'matthew',
    'anthony', 'mark', 'donald', 'steven', 'paul', 'andrew', 'joshua', 'george',
    'alexander', 'benjamin', 'samuel', 'henry', 'christopher', 'jacob', 'ethan',
    'nathan', 'ryan', 'tyler', 'logan', 'mason', 'dylan', 'luke', 'owen', 'jack',
    'liam', 'noah', 'aiden', 'lucas', 'oliver', 'elijah', 'muhammad', 'jayden',
];

export const keyboardPatterns = [
    'qwerty', 'qwertyuiop', 'asdfgh', 'asdfghjkl', 'zxcvbn', 'zxcvbnm',
    'qweasd', 'qweasdzxc', '1qaz2wsx', '1q2w3e4r', 'qazwsx', 'zaq1xsw2',
    'qwe123', '!@#$%^', '1qazxsw2', 'zaq12wsx', 'qwer1234', 'asdf1234',
    'asdfjkl;', 'poiuytrewq', 'lkjhgfdsa', 'mnbvcxz',
    '1qaz', '2wsx', '3edc', '4rfv', '5tgb', '6yhn', '7ujm', '8ik,',
    'qwertz', 'azerty', 'qwfpgj',
];

export const leetSpeakMap = {
    'a': ['@', '4'], 'e': ['3'], 'i': ['1', '!'], 'o': ['0'],
    's': ['$', '5'], 't': ['7'], 'l': ['1'], 'b': ['8'],
    'g': ['9'], 'z': ['2']
};

export const commonSuffixes = [
    '1', '12', '123', '1234', '!', '!!', '@', '#', '$', '1!', '123!',
    '2024', '2025', '2026', '01', '69', '99', '00', '007',
    '!@#', '!!!', '#1', '@1', '$1', '2023', '2022', '2021', '2020',
    'abc', 'xyz', '321', '111', '000', '777', '666', '13', '42', '7',
];

export const commonPrefixes = [
    'the', 'my', 'i', 'a', 'mr', 'ms', 'dr', 'super', 'mega', 'ultra',
    'dark', 'cool', 'big', 'hot', 'sexy', 'bad', 'mad', 'king', 'queen',
];

// Generate rule-based mutations of a word
export function generateMutations(word) {
    const mutations = new Set();
    mutations.add(word);
    mutations.add(word.toLowerCase());
    mutations.add(word.toUpperCase());
    mutations.add(word.charAt(0).toUpperCase() + word.slice(1).toLowerCase());

    // Suffix rules
    for (const suffix of commonSuffixes) {
        mutations.add(word + suffix);
        mutations.add(word.charAt(0).toUpperCase() + word.slice(1) + suffix);
    }

    // Prefix rules
    for (const prefix of commonPrefixes) {
        mutations.add(prefix + word);
    }

    // Leet speak
    let leeted = word.toLowerCase();
    for (const [letter, replacements] of Object.entries(leetSpeakMap)) {
        if (leeted.includes(letter)) {
            leeted = leeted.replace(new RegExp(letter, 'g'), replacements[0]);
        }
    }
    mutations.add(leeted);
    mutations.add(leeted.charAt(0).toUpperCase() + leeted.slice(1));

    // Reversed
    mutations.add(word.split('').reverse().join(''));

    // Doubled
    mutations.add(word + word);

    // Capitalize random
    mutations.add(word.toUpperCase().charAt(0) + word.slice(1));

    return [...mutations];
}

// Pre-build the expanded dictionary with all base words
export function buildExpandedDictionary() {
    const expanded = new Set();
    for (const pwd of commonPasswords) {
        expanded.add(pwd);
        // Only generate limited mutations for performance
        expanded.add(pwd.toLowerCase());
        expanded.add(pwd.toUpperCase());
        expanded.add(pwd.charAt(0).toUpperCase() + pwd.slice(1).toLowerCase());
        for (const s of ['1', '!', '123', '2024', '2025', '2026', '@', '#', '$', '!!', '12', '69', '99']) {
            expanded.add(pwd + s);
            expanded.add(pwd.charAt(0).toUpperCase() + pwd.slice(1) + s);
        }
    }
    return [...expanded];
}

// Pre-compute hash rainbow tables
export function buildRainbowTable(words, algorithm = 'md5') {
    const table = {};
    for (const word of words) {
        const hash = crypto.createHash(algorithm).update(word).digest('hex');
        table[hash] = word;
    }
    return table;
}

export const hashExamples = {
    md5: {
        'password': '5f4dcc3b5aa765d61d8327deb882cf99',
        '123456': 'e10adc3949ba59abbe56e057f20f883e',
        'admin': '21232f297a57a5a743894a0e4a801fc3',
        'letmein': '0d107d09f5bbe40cade3de5c71e9e9b7',
        'qwerty': 'd8578edf8458ce06fbc5bb76a58c5ca4',
        'abc123': 'e99a18c428cb38d5f260853678922e03',
        'monkey': 'd0763edaa9d9bd2a9516280e9044d885',
        'master': 'eb0a191797624dd3a48fa681d3061212',
        'dragon': '8621ffdbc5698829397d97767ac13db3',
        'login': 'd56b699830e77ba53855679cb1d252da',
        'shadow': '3bf1114a986ba87ed28fc1b5884fc2f8',
        'sunshine': '0571749e2ac330a7455571e7064d3286',
        'trustno1': '5fcfd41e547a12215b173ff47fdd3739',
        'iloveyou': 'f25a2fc72690b780b2a14e140ef6a9e0',
        'welcome': '40be4e59b9a2a2b5dffb918c0e86b3d7',
        'football': '37b4e2d82900d5e94b8da524fbeb33c0',
        'baseball': '276f8db0b86edaa7fc805516c852c889',
        'superman': '84d961568a65073a3bcf0eb216b2a576',
        'batman': 'ec0e2603172c73a8b644bb9456c1ff6e',
        'test': '098f6bcd4621d373cade4e832627b4f6',
    },
    sha1: {
        'password': '5baa61e4c9b93f3f0682250b6cf8331b7ee68fd8',
        '123456': '7c4a8d09ca3762af61e59520943dc26494f8941b',
        'admin': 'd033e22ae348aeb5660fc2140aec35850c4da997',
    },
    sha256: {
        'password': '5e884898da28047151d0e56f8dc6292773603d0d6aabbdd62a11ef721d1542d8',
        '123456': '8d969eef6ecad3c29a3a629280e686cf0c3f5d5a86aff3ca12020c923adc6c92',
        'admin': '8c6976e5b5410415bde908bd4dee15dfb167a9c873fc4bb8a81f6f2ab448a918',
    }
};
