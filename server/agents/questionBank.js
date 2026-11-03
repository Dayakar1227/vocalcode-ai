// Offline fallback used only when the LLM is unavailable.
// keys = concepts a good answer should mention (used by the fallback evaluator).
const bank = {
  Java: [
    { type: "OOP", difficulty: "beginner", topic: "Inheritance", q: "What is inheritance in Java and why is it useful?", keys: ["extends", "parent", "child", "reuse", "super"] },
    { type: "OOP", difficulty: "intermediate", topic: "Polymorphism", q: "Explain method overloading versus method overriding in Java.", keys: ["compile", "runtime", "same name", "parameters", "subclass"] },
    { type: "OOP", difficulty: "intermediate", topic: "Abstraction", q: "What is the difference between an abstract class and an interface in Java?", keys: ["abstract", "implements", "multiple", "default", "constructor"] },
    { type: "Technical", difficulty: "intermediate", topic: "Collections", q: "How does a HashMap work internally in Java?", keys: ["hash", "bucket", "collision", "equals", "resize"] },
    { type: "Technical", difficulty: "intermediate", topic: "Exception Handling", q: "Explain checked versus unchecked exceptions and how try-catch-finally works.", keys: ["checked", "unchecked", "finally", "throws", "runtime"] },
    { type: "Technical", difficulty: "advanced", topic: "Concurrency", q: "What is the difference between synchronized and volatile in Java?", keys: ["thread", "visibility", "atomic", "lock", "memory"] },
    { type: "DSA", difficulty: "beginner", topic: "Arrays vs Lists", q: "What is the difference between an array and an ArrayList in Java?", keys: ["fixed", "dynamic", "resize", "generics", "primitive"] },
    { type: "DSA", difficulty: "intermediate", topic: "Sorting", q: "Explain how merge sort works and its time complexity.", keys: ["divide", "merge", "n log n", "recursion", "stable"] },
    { type: "Coding", difficulty: "beginner", topic: "Array Sum", q: "Write a Java method that returns the sum of all integers in an array.", keys: ["loop", "sum", "array"], idealAnswer: "Initialize a total to zero, add each array element in one loop, and return the total. This runs in O(n) time and O(1) extra space." },
    { type: "Coding", difficulty: "intermediate", topic: "Two Sum", q: "Write a Java method that returns the indices of two numbers whose sum equals a target.", keys: ["hash map", "complement", "indices"], idealAnswer: "Scan once with a hash map from value to index. For each value, check whether target minus value is already present; return those indices. This is O(n) time and O(n) space." },
  ],
  Python: [
    { type: "OOP", difficulty: "beginner", topic: "Classes", q: "What is a class in Python and what does __init__ do?", keys: ["object", "constructor", "self", "attribute", "instance"] },
    { type: "OOP", difficulty: "intermediate", topic: "Inheritance", q: "How does inheritance and the super() function work in Python?", keys: ["parent", "child", "super", "override", "mro"] },
    { type: "Technical", difficulty: "beginner", topic: "Data Structures", q: "What is the difference between a list and a tuple in Python?", keys: ["mutable", "immutable", "hash", "performance", "index"] },
    { type: "Technical", difficulty: "intermediate", topic: "Decorators", q: "What is a decorator in Python and when would you use one?", keys: ["function", "wrapper", "higher-order", "@", "logging"] },
    { type: "Technical", difficulty: "intermediate", topic: "Generators", q: "Explain generators and the yield keyword.", keys: ["lazy", "iterator", "memory", "yield", "state"] },
    { type: "Technical", difficulty: "advanced", topic: "Concurrency", q: "What is the GIL in Python and how does it affect multithreading?", keys: ["global interpreter lock", "thread", "cpu", "multiprocessing", "io"] },
    { type: "DSA", difficulty: "intermediate", topic: "Hashing", q: "How do Python dictionaries work and what is their lookup complexity?", keys: ["hash", "o(1)", "collision", "key", "resize"] },
    { type: "DSA", difficulty: "intermediate", topic: "Recursion", q: "Explain recursion with an example and its drawbacks in Python.", keys: ["base case", "stack", "recursive", "limit", "memoization"] },
    { type: "Coding", difficulty: "beginner", topic: "Array Sum", q: "Write a Python function that returns the sum of all integers in a list.", keys: ["loop", "sum", "list"], idealAnswer: "Initialize a total to zero, add each list item in one loop, and return the total. This runs in O(n) time and O(1) extra space." },
    { type: "Coding", difficulty: "intermediate", topic: "Two Sum", q: "Write a Python function that returns the indices of two numbers whose sum equals a target.", keys: ["dictionary", "complement", "indices"], idealAnswer: "Scan once with a dictionary from value to index. For each value, check whether target minus value is already present; return those indices. This is O(n) time and O(n) space." },
  ],
  JavaScript: [
    { type: "Technical", difficulty: "beginner", topic: "Variables", q: "What is the difference between var, let and const in JavaScript?", keys: ["scope", "hoisting", "block", "reassign", "function"] },
    { type: "Technical", difficulty: "intermediate", topic: "Closures", q: "What is a closure in JavaScript? Give a practical use.", keys: ["scope", "function", "lexical", "private", "variable"] },
    { type: "Technical", difficulty: "intermediate", topic: "Async", q: "Explain promises and async/await in JavaScript.", keys: ["asynchronous", "resolve", "reject", "then", "await"] },
    { type: "Technical", difficulty: "advanced", topic: "Event Loop", q: "How does the JavaScript event loop work?", keys: ["call stack", "queue", "microtask", "single-threaded", "callback"] },
    { type: "OOP", difficulty: "intermediate", topic: "Prototypes", q: "Explain prototypal inheritance in JavaScript.", keys: ["prototype", "chain", "object", "__proto__", "class"] },
    { type: "OOP", difficulty: "beginner", topic: "this keyword", q: "How does the this keyword behave in JavaScript?", keys: ["context", "call", "arrow", "bind", "object"] },
    { type: "DSA", difficulty: "intermediate", topic: "Arrays", q: "Explain map, filter and reduce on arrays.", keys: ["new array", "callback", "accumulator", "immutable", "iterate"] },
    { type: "DSA", difficulty: "intermediate", topic: "Complexity", q: "What is Big-O notation and how would you analyse a nested loop?", keys: ["worst case", "n squared", "growth", "input size", "time"] },
    { type: "Coding", difficulty: "beginner", topic: "Array Sum", q: "Write a JavaScript function that returns the sum of all numbers in an array.", keys: ["loop", "sum", "array"], idealAnswer: "Initialize a total to zero, add each array element in one loop, and return the total. This runs in O(n) time and O(1) extra space." },
    { type: "Coding", difficulty: "intermediate", topic: "Two Sum", q: "Write a JavaScript function that returns the indices of two numbers whose sum equals a target.", keys: ["map", "complement", "indices"], idealAnswer: "Scan once with a Map from value to index. For each value, check whether target minus value is already present; return those indices. This is O(n) time and O(n) space." },
  ],
};

module.exports = bank;
