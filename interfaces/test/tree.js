var shortid = require('shortid');
module.exports = {
  id: shortid.generate(),
  name: 'root',
  children: [
    {
      id: shortid.generate(),
      name: 'family1',
      children: [
        {
          id: shortid.generate(),
          name: 'genus1',
          children: [
            {
              id: shortid.generate(),
              name: 'species1',
              children: []
            },
            {
              id: shortid.generate(),
              name: 'species2',
              children: []
            },
          ]
        },
        {
          id: shortid.generate(),
          name: 'genus2',
          children: [
            {
              id: shortid.generate(),
              name: 'species3',
              children: []
            },
            {
              id: shortid.generate(),
              name: 'species4',
              children: []
            },
          ]
        },
      ]
    },
    {
      id: shortid.generate(),
      name: 'family2',
      children: [
        {
          id: shortid.generate(),
          name: 'genus3',
          children: [
            {
              id: shortid.generate(),
              name: 'species5',
              children: [
                {
                  id: shortid.generate(),
                  name: 'subspecies1',
                  children: []
                },
                {
                  id: shortid.generate(),
                  name: 'subspecies2',
                  children: []
                },
                {
                  id: shortid.generate(),
                  name: 'subspecies3',
                  children: []
                },
              ]
            },
            {
              id: shortid.generate(),
              name: 'species6',
              children: []
            },
            {
              id: shortid.generate(),
              name: 'species7',
              children: []
            },
          ]
        },
        {
          id: shortid.generate(),
          name: 'genus4',
          children: [
            {
              id: shortid.generate(),
              name: 'species8',
              children: []
            },
            {
              id: shortid.generate(),
              name: 'species9',
              children: []
            },
          ]
        },
        {
          id: shortid.generate(),
          name: 'genus5',
          children: [
            {
              id: shortid.generate(),
              name: 'species10',
              children: []
            },
          ]
        },
      ]
    },
  ]
}