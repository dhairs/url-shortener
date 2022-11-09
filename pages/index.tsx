import Head from 'next/head'
import Image from 'next/image'
import styles from '../styles/Home.module.css'

export default function Home() {
  return (
    <div className={styles.container}>
      <div className={styles.main}>
        <div className={styles.formContainer}>
      <input placeholder='Enter your slug'/>
      <input placeholder='Enter the URL'/>
      <button>Submit</button>
      </div>
      </div>
      </div>
  )
}
