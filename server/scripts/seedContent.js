require('dotenv').config();
const mongoose = require('mongoose');
const Resource = require('../models/Resource');
const Blog = require('../models/Blog');

const seedContent = async () => {
  try {
    const mongoUri = process.env.MONGO_URI;
    if (!mongoUri) {
      console.error('MONGO_URI is missing from environment. Exiting.');
      process.exit(1);
    }

    console.log('Connecting to MongoDB for seeding Prep Hub content...');
    await mongoose.connect(mongoUri);
    console.log('Connected to MongoDB');

    // 1. Clear existing resources and blogs
    await Resource.deleteMany({});
    await Blog.deleteMany({});
    console.log('Cleared existing resources and blog posts');

    // 2. Define Resources (6 items)
    const dummyResources = [
      {
        title: 'GeeksforGeeks DSA Self Paced',
        description: 'Comprehensive course covering theoretical concepts and practical problems across arrays, linked lists, trees, graphs and dynamic programming.',
        url: 'https://www.geeksforgeeks.org/data-structures/',
        category: 'dsa',
        tags: ['Basics', 'LeetCode', 'Algorithms'],
        badge: 'Beginner Friendly'
      },
      {
        title: 'System Design Primer',
        description: 'An open-source github repository that helps you learn how to build large-scale distributed systems. Includes real-world architecture case studies.',
        url: 'https://github.com/donnemartin/system-design-primer',
        category: 'system-design',
        tags: ['Scalability', 'Database', 'Microservices'],
        badge: 'Most Starred'
      },
      {
        title: 'Frontend Developer Roadmap',
        description: 'A step-by-step interactive roadmap that lists all frontend engineering paths, technologies, libraries, and frameworks to learn in 2026.',
        url: 'https://roadmap.sh/frontend',
        category: 'roadmap',
        tags: ['HTML/CSS', 'React', 'TypeScript'],
        badge: 'Tech Path'
      },
      {
        title: 'Hussein Nasser - Backend Engineering',
        description: 'Deep dives into databases, proxy servers, networks, protocols, load balancing, and complex server architectures on YouTube.',
        url: 'https://www.youtube.com/@HusseinNasser',
        category: 'youtube',
        tags: ['Databases', 'Networking', 'Security'],
        badge: 'Deep Dive'
      },
      {
        title: 'Gaurav Sen - System Design Youtube Channel',
        description: 'Easy-to-understand explanations of scaling architectures, database sharding, hashing strategies, and monolithic vs microservices.',
        url: 'https://www.youtube.com/@GauravSen',
        category: 'youtube',
        tags: ['High Level Design', 'Sharding', 'Load Balancers'],
        badge: 'System Design'
      },
      {
        title: 'Google Technical Guide to Interviews',
        description: 'Official prep recommendations from Google engineers covering coding concepts, system architectural standards, and soft skills.',
        url: 'https://techdevguide.withgoogle.com/',
        category: 'other',
        tags: ['Interview Prep', 'FAANG', 'Careers'],
        badge: 'Official Guide'
      }
    ];

    // 3. Define Blog Posts (3 items with detailed markdown content)
    const dummyBlogs = [
      {
        title: 'Top 10 DSA patterns for FAANG interviews',
        slug: 'top-10-dsa-patterns-for-faang-interviews',
        category: 'dsa',
        author: 'Ashish Kumar (Ex-Google)',
        readTime: 6,
        published: true,
        content: `# Top 10 DSA Patterns for FAANG Interviews

In a typical coding interview at top tier tech companies like Google, Meta, or Amazon, you aren't expected to memorize 500+ LeetCode problems. Instead, you need to master **algorithmic patterns** that can be applied to solve hundreds of unique questions.

Here are the top 10 patterns you must master to ace your next round.

---

## 1. Sliding Window
Used to perform operations on a specific window size of a given array or string, e.g., finding the longest substring with K distinct characters.
* **LeetCode examples:** Longest Substring Without Repeating Characters, Minimum Window Substring.

\`\`\`javascript
// Classic Sliding Window Template
function findMaxSumSubarray(arr, k) {
  let maxSum = 0, windowSum = 0;
  let windowStart = 0;

  for (let windowEnd = 0; windowEnd < arr.length; windowEnd++) {
    windowSum += arr[windowEnd]; // add the next element
    
    // slide the window if we hit the window size 'k'
    if (windowEnd >= k - 1) {
      maxSum = Math.max(maxSum, windowSum);
      windowSum -= arr[windowStart]; // subtract the element going out
      windowStart++; // slide window ahead
    }
  }
  return maxSum;
}
\`\`\`

## 2. Two Pointers
Two pointers iterate through the data structure in tandem until one or both hit certain conditions. Perfect for sorted arrays or lists.
* **LeetCode examples:** 3Sum, Container With Most Water.

## 3. Fast & Slow Pointers (Hare & Tortoise)
Uses two pointers moving at different speeds to detect cycles in linked lists or find the middle element.
* **LeetCode examples:** Linked List Cycle, Happy Number.

> [!TIP]
> Always check for empty inputs or single-element lists before initiating fast and slow pointer references to prevent NullPointer errors.

## 4. Merge Intervals
An efficient technique to deal with overlapping intervals, merging them, or inserting new ones.
* **LeetCode examples:** Merge Intervals, Insert Interval.

## 5. In-place Reversal of a Linked List
Reversing links between nodes in a linked list without using extra memory.
* **LeetCode examples:** Reverse a Linked List, Reverse Nodes in k-Group.

## 6. Two Heaps
Useful when we are given a set of elements such that we can divide them into two parts and want to know the smallest element in one part and the largest in the other.
* **LeetCode examples:** Find Median from Data Stream.

## 7. Top 'K' Elements
Uses a Min-Heap or Max-Heap to track the K largest, smallest, or most frequent elements in a dataset.
* **LeetCode examples:** Kth Largest Element in an Array, Top K Frequent Elements.

## 8. K-way Merge
Helps you solve problems that involve a list of sorted arrays, merging them into one sorted result.
* **LeetCode examples:** Merge k Sorted Lists.

## 9. Backtracking
An algorithmic-technique that uses recursion to solve problems incrementally by trying out different options and removing them if they fail.
* **LeetCode examples:** Subsets, Permutations, N-Queens.

## 10. Topological Sort
Used to find a linear ordering of vertices in a Directed Acyclic Graph (DAG) based on their dependencies.
* **LeetCode examples:** Course Schedule, Alien Dictionary.`
      },
      {
        title: 'How to write a resume that passes ATS in 2025',
        slug: 'how-to-write-a-resume-that-passes-ats-in-2025',
        category: 'career',
        author: 'Sarah Jenkins (Principal Tech Recruiter)',
        readTime: 4,
        published: true,
        content: `# How to Write a Resume That Passes ATS in 2025

Are you applying to dozens of software engineering roles only to receive automated rejection emails within hours? The culprit is likely the **Applicant Tracking System (ATS)**. 

Companies use ATS parsers to pre-screen resumes before a human recruiter ever sees them. If the parser cannot read your text or fails to identify relevant skills, your application is automatically discarded.

Here is a step-by-step guide to writing an ATS-optimized resume.

---

## 1. Ditch the Complex Multi-Column Layouts
Modern ATS systems parse document structures linearly (left-to-right, top-to-bottom). Multi-column templates, text boxes, and complex graphics frequently scramble the text order, making your resume look like gigberish to the machine.

* **Do:** Use a clean, single-column layout.
* **Do:** Keep margins at 0.5 to 1.0 inch.
* **Avoid:** Charts, skill meters, icons, images, and custom styling vectors.

## 2. Standardize Your Section Headers
Do not get creative with section labels. The ATS categorizes your resume content by identifying standardized headers.

Use these exact terms:
* **Professional Experience** (or Work Experience)
* **Technical Skills**
* **Education**
* **Projects**

> [!WARNING]
> Labeling your experience as "My Engineering Journey" or skills as "What I Excel At" will confuse the parser, and it may classify those sections as empty!

## 3. Adopt the STAR Method for Experience Bullet Points
When writing your bullet points, focus on impact and metrics. Recruiters and parsers alike scan for actions and numbers.

> **STAR Formula:** **S**ituation, **T**ask, **A**ction, **R**esult.

* **Weak Bullet Point:** "Responsible for writing backend APIs and fixing system bugs."
* **ATS-Optimized Bullet Point:** "Redesigned the core backend API using NodeJS and Redis caching, reducing server latency by **35%** and supporting a **2.5x** increase in concurrent user requests."

## 4. Match Key terms from the Job Description
Tailor your "Technical Skills" section for every role. The ATS scans your resume for direct matches with keywords listed in the job description.

* If the posting mentions "React.js", do not write "ReactJS" or "React library".
* If it lists "CI/CD pipelines", explicitly mention "CI/CD" in your skills.

## 5. File Formats: PDF vs DOCX
While most modern ATS systems parse PDFs perfectly, a standard \`.docx\` (Microsoft Word) file is still considered the safest, most compatible format for older parsers. If the site gives no preference, standard PDF exports are highly recommended.`
      },
      {
        title: 'System design interview: where to start',
        slug: 'system-design-interview-where-to-start',
        category: 'system-design',
        author: 'Vikram Mehta (Principal Architect)',
        readTime: 5,
        published: true,
        content: `# System Design Interview: Where to Start

The System Design interview is one of the most ambiguous rounds in modern software engineering interviews. Unlike coding rounds, there is no single "correct" answer. Instead, the interviewer wants to evaluate your ability to handle open-ended scaling challenges, make trade-offs, and navigate real-world constraints.

If you don't structure your design session, you will quickly run out of time or get lost in irrelevant database details. Here is a battle-tested framework to tackle any system design prompt.

---

## The System Design Framework: 4 Core Phases

\`\`\`mermaid
graph TD
  A["Phase 1: Clarify Requirements"] --> B["Phase 2: High-Level Design"]
  B --> C["Phase 3: Deep Dive Components"]
  C --> D["Phase 4: Scaling & Bottle-necks"]
\`\`\`

---

## Phase 1: Clarify Requirements (5-10 minutes)
Never start designing immediately! You must scope the problem first.
* **Functional Requirements:** What features must we build? (e.g., "User can post a tweet", "User can follow others").
* **Non-Functional Requirements:** What are the scale and performance bounds? (e.g., 100M active daily users, read-heavy ratio of 100:1, target latency < 100ms, 99.99% availability).
* **Back-of-the-Envelope Estimation:** Calculate daily storage constraints and required network bandwidth.

## Phase 2: High-Level Design (10-15 minutes)
Draft the high-level request lifecycle. Define the components and draw simple boxes and arrows connecting them.

Identify:
1. **API Endpoints:** \`POST /v1/tweet\`, \`GET /v1/feed\`.
2. **Key Entities:** Users, Tweets, Follows.
3. **Core Services:** Web Servers, Load Balancers, Application Layer.
4. **Primary Storage Choice:** SQL vs NoSQL.

> [!NOTE]
> For highly structured relational relationships (like follows and user profiles), SQL databases (PostgreSQL) are excellent. For unstructured, rapidly accumulating scale (like tweets or events), key-value or document stores (MongoDB/Cassandra) perform better.

## Phase 3: Detailed Deep Dive (15 minutes)
Now, focus on resolving the primary constraints identified in Phase 1.
* **How do we generate the user's news feed fast?** Explain feed pre-computation (Fan-out on-write) vs dynamic query computation (Fan-out on-read).
* **Caching Strategy:** Where do we add cache layers (Redis/Memcached)? What is the eviction policy (LRU)?
* **File Storages:** Store media assets (photos/videos) in an Object Store (AWS S3) and deliver them via a Content Delivery Network (CDN) to minimize edge latency.

## Phase 4: Identify Bottlenecks & Scale (5-10 minutes)
Wrap up by explaining how you would scale the system under extreme load:
* **Database Sharding:** Shard SQL databases based on \`userId\` to distribute data writes.
* **Replication:** Add read replicas to offload primary database select queries.
* **Rate Limiting:** Protect your servers from DDoS attacks or scrapers by introducing token bucket rate limiters.`
      }
    ];

    // 4. Save to Database
    await Resource.insertMany(dummyResources);
    console.log(`Successfully seeded ${dummyResources.length} resources`);

    await Blog.insertMany(dummyBlogs);
    console.log(`Successfully seeded ${dummyBlogs.length} blog posts`);

    console.log('Prep Hub seeding completed successfully!');
  } catch (err) {
    console.error('Error seeding Prep Hub content:', err);
  } finally {
    await mongoose.disconnect();
    console.log('Disconnected from MongoDB');
    process.exit(0);
  }
};

seedContent();
