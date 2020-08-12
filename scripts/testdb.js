const firebase = require("firebase/app");
require("firebase/auth");
require("firebase/firestore");

const admin =  require('firebase-admin');


const firebaseConfig = {
};

//const ctc = firebase.initializeApp(firebaseConfig);
//const firestore = ctc.firestore();

admin.initializeApp(firebaseConfig);
const db = admin.firestore();

const getPuzzleReplays = puzzleId => Promise.resolve()
	.then(() => db.collection(`puzzles/${puzzleId}/replays`).get())
	.then(replaysSnap => replaysSnap.docs.map(doc => doc.data()));

const getPuzzle = id => Promise.all([
		db.collection('puzzles').doc(id).get().then(snap => snap.data()),
		getPuzzleReplays(id)
	])
	.then(([puzzle, replays]) => ({puzzle: puzzle, replays}));

console.time('test');
//console.log('db:', db.collection('puzzles'));
//console.log('db.doc:', db.collection('puzzles').doc('7FTq4BpLhf'));
//const replays = db.collection('replays');
//replays.where('id', '=='get()
getPuzzle('7FTq4BpLhf')
	.then(puzzle => {
		console.log('puzzle:', puzzle);
	})
/*
replays.get()
	.then(snapshot => snapshot.docs)
	.then(docs => Promise.all(docs
		.map(doc => {
			const data = doc.data();
			return data.puzzle.get()
				.then(puzzleSnap => ({doc, data, puzzle: puzzleSnap.data()}))
			return {doc, data};
		})
	))
		console.log(snapshot);
		console.log(snapshot.docs);
		console.log(snapshot.docs.length);
		console.log(snapshot.docs[0]);
		console.log(snapshot.docs[0].data());
		console.log(snapshot.docs[0].data().puzzle.get());
		return snapshot.docs[0].data().puzzle.get();
	})
	.then(puzzle => console.log(puzzle))
*/
	.then(() => console.timeEnd('test'));
/*
console.time('listCollections');
db.listCollections()
	.then(collections => {
		collections.forEach(collection => {
			console.log(collection._queryOptions.collectionId);
		});
		return Promise.all(collections.map(c => c.get()));
	})
	.then(collections => {
		collections.forEach(collection => {
			console.log(collection._queryOptions.collectionId, collection.size);
		});
	})
	.then(() => console.timeEnd('listCollections'));
*/
/*
var starCountRef = firebase.database().ref('posts/' + postId + '/starCount');
starCountRef.on('value', function(snapshot) {
 	updateStarCount(postElement, snapshot.val());
});


firebase.database().ref('users/' + userId).set({
username: name,
email: email,
profile_picture : imageUrl
});
*/
/*
console.log('firebase:', Object.keys(firebase));

const firestore = firebase.firestore();
console.log('firestore:', firestore);

var currentUser = firebase.auth().currentUser;
console.log('currentUser:', currentUser);
*/
//var dbRef = firebase.firestore().ref();
//console.log('dbRef:', dbRef);

//var userId = firebase.auth().currentUser.uid;
/*
return firebase.database().ref('/users/' + userId).once('value').then(function(snapshot) {
	var username = (snapshot.val() && snapshot.val().username) || 'Anonymous';
	// ...
});
*/