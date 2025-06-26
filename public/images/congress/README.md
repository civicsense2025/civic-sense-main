# Congressional Photos Directory

This directory contains locally stored congressional member photos organized by Congress number.

## Structure
```
public/images/congress/
├── 117/          # 117th Congress (2021-2023)
├── 118/          # 118th Congress (2023-2025)  
├── 119/          # 119th Congress (2025-2027)
└── {bioguide_id}/
    ├── original.jpg   # Original downloaded photo
    ├── large.jpg      # 600x600 optimized for profile pages
    ├── medium.jpg     # 300x300 optimized for cards
    └── thumbnail.jpg  # 150x150 optimized for lists
```

## Photo Sources
Photos are downloaded from the [unitedstates/images](https://github.com/unitedstates/images) repository.

## Management
- Use the admin congressional photos panel to download and process photos
- Photos are automatically optimized into multiple sizes for performance
- Each photo is stored with congress number for historical tracking

Generated on: 2025-06-26T19:04:14.205Z
